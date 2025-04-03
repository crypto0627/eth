import React from 'react'
import styles from '@/app/style'
import { discount, streamer } from '@/assets'
import GetStarted from '@/components/GetStarted'
import Link from 'next/link'
import Image from 'next/image'

export default function Hero() {
  return (
    <section
      id="home"
      className={`flex md:flex-row flex-col ${styles.paddingY}`}
    >
      <div
        className={`flex-1 ${styles.flexStart} flex-col xl:px-0 sm:px-16 px-6`}
      >
        <div className="flex flex-row justify-between items-center w-full">
          <h1 className="flex-1 font-poppins font-semibold ss:text-[72px] text-[52px] text-white ss:leading-[100.8px] leading-[75px]">
            The Next <br className="sm:block hidden" />{' '}
            <span className="text-gradient">Web3</span>{' '}
          </h1>
          <div className="ss:flex hidden md:mr-4 mr-0">
            <Link href="/launch">
              <GetStarted />
            </Link>
          </div>
        </div>

        <h1 className="font-poppins font-semibold ss:text-[68px] text-[52px] text-white ss:leading-[100.8px] leading-[75px] w-full">
          Donation Platform.
        </h1>
        <p className={`${styles.paragraph} max-w-[470px] mt-5`}>
          Revolutionizing donation culture on live streaming platforms. Empower
          streamers to launch ERC-1155 NFTs, enabling viewers to support content
          creators directly through Web3 wallets.
        </p>
      </div>

      <Link href="/launch">
        <GetStarted />
      </Link>

      <div
        className={`flex-1 flex ${styles.flexCenter} md:my-1 my-10 relative`}
      >
        <Image
          src={streamer}
          alt="streamer"
          className="w-[100%] h-[90%] relative z-[6]"
        />

        {/* gradient start */}
        <div className="absolute z-[0] w-[40%] h-[35%] top-0 pink__gradient" />
        <div className="absolute z-[1] w-[80%] h-[80%] rounded-full white__gradient bottom-40" />
        <div className="absolute z-[0] w-[50%] h-[50%] right-20 bottom-20 blue__gradient" />
        {/* gradient end */}
      </div>
    </section>
  )
}
