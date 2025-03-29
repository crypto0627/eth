import { Anthropic } from "@anthropic-ai/sdk";
import {
  MessageParam,
  Tool,
} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import readline from "readline/promises";
import dotenv from "dotenv";

dotenv.config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is not set");
}

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
}

export default class MCPClient {
  private mcp: Client;
  private anthropic: Anthropic;
  private transport: StdioClientTransport | null = null;
  private tools: Tool[] = [];
  private retryConfig: RetryConfig = {
    maxRetries: 5,
    initialDelay: 1000, // 1 second
    maxDelay: 32000, // 32 seconds
  };

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });
    this.mcp = new Client({ name: "mcp-client-cli", version: "1.0.0" });
  }
  // methods will go here
  async connectToServer(serverScriptPath: string) {
    try {
      const isJs = serverScriptPath.endsWith(".js");
      const isPy = serverScriptPath.endsWith(".py");
      if (!isJs && !isPy) {
        throw new Error("Server script must be a .js or .py file");
      }
      const command = isPy
        ? process.platform === "win32"
          ? "python"
          : "python3"
        : process.execPath;
      
      this.transport = new StdioClientTransport({
        command,
        args: [serverScriptPath],
      });
      this.mcp.connect(this.transport);
      
      const toolsResult = await this.mcp.listTools();
      this.tools = toolsResult.tools.map((tool) => {
        return {
          name: tool.name,
          description: tool.description,
          input_schema: tool.inputSchema,
        };
      });
      console.log(
        "Connected to server with tools:",
        this.tools.map(({ name }) => name)
      );
    } catch (e) {
      console.log("Failed to connect to MCP server: ", e);
      throw e;
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: any;
    let currentDelay = this.retryConfig.initialDelay;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // 只有在特定錯誤碼時才重試
        if (error?.status === 529 || error?.code === 529) {
          console.log(
            `${context} - Attempt ${attempt} failed. Retrying in ${
              currentDelay / 1000
            } seconds...`
          );
          
          await this.delay(currentDelay);
          
          // 計算下一次延遲時間（指數退避）
          currentDelay = Math.min(
            currentDelay * 2,
            this.retryConfig.maxDelay
          );
          continue;
        }
        
        // 其他錯誤直接拋出
        throw error;
      }
    }

    throw new Error(
      `${context} - Failed after ${this.retryConfig.maxRetries} attempts. Last error: ${lastError}`
    );
  }

  async processQuery(query: string) {
    const messages: MessageParam[] = [
      {
        role: "user",
        content: query,
      },
    ];

    try {
      const response = await this.retryWithExponentialBackoff(
        () =>
          this.anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1000,
            messages,
            tools: this.tools,
          }),
        "Initial query"
      );

      const finalText = [];
      const toolResults = [];

      for (const content of response.content) {
        if (content.type === "text") {
          finalText.push(content.text);
        } else if (content.type === "tool_use") {
          const toolName = content.name;
          const toolArgs = content.input as { [x: string]: unknown } | undefined;

          const result = await this.mcp.callTool({
            name: toolName,
            arguments: toolArgs,
          });
          toolResults.push(result);
          finalText.push(
            `[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`
          );

          messages.push({
            role: "user",
            content: result.content as string,
          });

          const followUpResponse = await this.retryWithExponentialBackoff(
            () =>
              this.anthropic.messages.create({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 1000,
                messages,
              }),
            "Follow-up response"
          );

          finalText.push(
            followUpResponse.content[0].type === "text"
              ? followUpResponse.content[0].text
              : ""
          );
        }
      }

      return finalText.join("\n");
    } catch (error) {
      console.error("Error processing query:", error);
      throw error;
    }
  }

  async chatLoop() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  
    try {
      console.log("\nMCP Client Started!");
      console.log("Type your queries or 'quit' to exit.");
  
      while (true) {
        const message = await rl.question("\nQuery: ");
        if (message.toLowerCase() === "quit") {
          break;
        }
        const response = await this.processQuery(message);
        console.log("\n" + response);
      }
    } finally {
      rl.close();
    }
  }
  
  async cleanup() {
    await this.mcp.close();
  }
}

async function main() {
    if (process.argv.length < 3) {
      console.log("Usage: node index.ts /Users/jakekuo/Desktop/web3-workspace/eth-global-taipei-team-3p/apps/mcp-server/build/index.js");
      return;
    }
    const mcpClient = new MCPClient();
    try {
      await mcpClient.connectToServer(process.argv[2]);
      await mcpClient.chatLoop();
    } finally {
      await mcpClient.cleanup();
      process.exit(0);
    }
  }
  
  main();