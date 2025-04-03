'use client'

import { useState } from 'react'
import { close, logo, menu } from '../assets'
import { navLinks } from '../constants'
import { navLinksTypes } from '@/types/ui.type'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function Navbar() {
  const [active, setActive] = useState<string>('Home')
  const [toggle, setToggle] = useState<boolean>(false)
  const router = useRouter()

  return (
    <nav className="w-full flex py-6 justify-between items-center navbar">
      <Image src={logo} alt="Authenpay" width={248} height={64} />

      <ul className="list-none sm:flex hidden justify-end items-center flex-1">
        {navLinks.map((nav: navLinksTypes, index) => (
          <li
            key={nav.id}
            className={`font-poppins font-normal cursor-pointer text-[16px] ${
              active === nav.title ? 'text-white' : 'text-dimWhite'
            } ${index === navLinks.length - 1 ? 'mr-0' : 'mr-10'}`}
            onClick={() => {
              if (index === 1) {
                window.open('https://github.com/hollow-leaf/psyduck', '_blank')
              } else if (index === 2) {
                router.push('/launch')
              } else {
                setActive(nav.title)
              }
            }}
          >
            <a href={index === 0 ? `#${nav.id}` : undefined}>{nav.title}</a>
          </li>
        ))}
      </ul>

      <div className="sm:hidden flex flex-1 justify-end items-center">
        <button
          className="bg-transparent border-0 p-0 cursor-pointer"
          onClick={() => setToggle(!toggle)}
        >
          <Image
            src={toggle ? close : menu}
            alt="menu"
            className="object-contain"
            width={28}
            height={28}
          />
        </button>

        <div
          className={`${
            !toggle ? 'hidden' : 'flex'
          } p-6 bg-black-gradient absolute top-20 right-0 mx-4 my-2 min-w-[140px] rounded-xl sidebar`}
        >
          <ul className="list-none flex justify-end items-start flex-1 flex-col">
            {navLinks.map((nav, index) => (
              <li
                key={nav.id}
                className={`font-poppins font-medium cursor-pointer text-[16px] ${
                  active === nav.title ? 'text-white' : 'text-dimWhite'
                } ${index === navLinks.length - 1 ? 'mb-0' : 'mb-4'}`}
                onClick={() => setActive(nav.title)}
              >
                <Link href={`#${nav.id}`}>{nav.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  )
}
