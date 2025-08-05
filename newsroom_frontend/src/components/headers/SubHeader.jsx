// /src/components/headers/SubHeader.jsx - Lopullinen versio

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import styles from "./SubHeader.module.css";

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function SubHeader({ topCategories }) {
  const params = useParams();
  const locale = params?.locale || "fi";

  return (
    <header className={styles.subheader}>
      <nav className={styles.nav}>
        {topCategories.map((category) => (
          <Link 
            key={category.id} 
            href={`/${locale}?category=${category.slug}`}
            className={styles.category}
          >
            {`${capitalize(category.slug)} (${category.count})`}
          </Link>
        ))}
      </nav>
    </header>
  );
}