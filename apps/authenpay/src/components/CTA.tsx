import styles from '@/app/style'
import Button from '@/components/Button'
import Link from 'next/link'

export default function CTA() {
  return (
    <section
      className={`${styles.flexCenter} ${styles.marginY} ${styles.padding} sm:flex-row flex-col bg-black-gradient-2 rounded-[20px] box-shadow`}
    >
      <div className="flex-1 flex flex-col">
        <h2 className={styles.heading2}>Let’s try our wallet now!</h2>
      </div>

      <div className={`${styles.flexCenter} sm:ml-10 ml-0 sm:mt-0 mt-10 hover:transform hover:scale-105 transition-all duration-300`}>
        <Link href="/launch">
          <Button />
        </Link>
      </div>
    </section>
  )
}
