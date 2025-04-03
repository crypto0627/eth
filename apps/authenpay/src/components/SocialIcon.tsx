'use client'

import Image from 'next/image'
import { socialMediaTypes } from '@/types/ui.type'

interface SocialIconProps {
  social: socialMediaTypes
  isLast: boolean
}

export function SocialIcon({ social, isLast }: SocialIconProps) {
  return (
    <Image
      src={social.icon}
      alt={social.id}
      className={`object-contain cursor-pointer ${isLast ? 'mr-0' : 'mr-6'}`}
      width={21}
      height={21}
      onClick={() => window.open(social.link)}
    />
  )
}
