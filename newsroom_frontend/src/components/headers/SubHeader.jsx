import Link from "next/link";
import styles from "./SubHeader.module.css";

export default function SubHeader() {

  return (
    <header className={styles.subheader}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.category}>
          Politics
        </Link>
        <Link href="/" className={styles.category}>
          Opinions
        </Link>
        <Link href="/" className={styles.category}>
          Style
        </Link>
        <Link href="/" className={styles.category}>
          Investigations
        </Link>
        <Link href="/" className={styles.category}>
          Climate
        </Link>
        <Link href="/" className={styles.category}>
          Well-Being
        </Link>
        <Link href="/" className={styles.category}>
          Business
        </Link>
        <Link href="/" className={styles.category}>
          Tech
        </Link>
        <Link href="/" className={styles.category}>
          World
        </Link>
      </nav>
    </header>
  );
}
