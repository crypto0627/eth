'use client'
import styles from '@/app/style'
import { logo } from '../assets'
import { socialMedia } from '@/constants'
import { socialMediaTypes } from '@/types/ui.type'
import Image from 'next/image'
import { SocialIcon } from '@/components/SocialIcon'

export default function Footer() {
  return (
    <section className={`${styles.flexCenter} ${styles.paddingY} flex-col`}>
      <div className={`${styles.flexCenter} md:flex-row flex-col mb-8 w-full`}>
        <div className="flex flex-col justify-start mr-10 items-center">
          <Image
            src={logo}
            alt="Psyduck"
            className="object-contain"
            width={266}
            height={72}
          />
          <p className={`${styles.paragraph} mt-4`}>
            A new way to make your donation easy, reliable and secure.
          </p>
        </div>
      </div>

      <div className="w-full flex justify-between items-center md:flex-row flex-col pt-6 border-t-[1px] border-t-[#3F3E45]">
        <p className="font-poppins font-normal text-center text-[18px] leading-[27px] text-white">
          Copyright Ⓒ 2024 Psyduck. All Rights Reserved.
        </p>

        <div className="flex flex-row md:mt-0 mt-6">
          {socialMedia.map((social: socialMediaTypes, index) => (
            <SocialIcon
              key={social.id}
              social={social}
              isLast={index === socialMedia.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
