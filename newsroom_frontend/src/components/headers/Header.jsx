"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./Header.module.css";
import LogoHologram from "./LogoHologram";

const leftNavItems = [{ href: "/", label: "Vasen1" }];

const rightNavItems = [
  { href: "/uutiset", label: "Oikea1" },
  { href: "/mielipiteet", label: "Oikea2" },
];

export default function Header() {
  const [stickyActive, setStickyActive] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setStickyActive(window.scrollY > 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`${styles.header} ${stickyActive ? styles.stickyActive : ""}`}
    >
      <nav className={`${styles.nav} ${styles.leftNav}`}>
        {leftNavItems.map(({ href, label }) => (
          <Link key={href} href={href} className={styles.link}>
            {label}
          </Link>
        ))}
      </nav>

      <div className={styles.logoContainer}>
        <Link href="/" className={styles.logo}>
          <LogoHologram />
        </Link>
      </div>

      <nav className={`${styles.nav} ${styles.rightNav}`}>
        {rightNavItems.map(({ href, label }) => (
          <Link key={href} href={href} className={styles.link}>
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
