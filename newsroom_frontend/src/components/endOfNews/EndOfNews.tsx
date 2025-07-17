import React from "react";
import Image from "next/image";
import styles from "./EndOfNewsComponent.module.css";

const EndOfNewsComponent = () => {
  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className={styles.container}>
      {/* Simple divider line */}
      <div className={styles.divider}></div>

      {/* Main message */}
      <div className={styles.textContainer}>
        <h2 className={styles.title}>You&#39;ve reached the end</h2>
        <p className={styles.description}>
          That&#39;s all the latest news for now. Check back soon for more updates.
        </p>
      </div>

      {/* Navigation options */}
      <div className={styles.navigationContainer}>
        <button
          onClick={handleScrollToTop}
          className={styles.backButton}
          aria-label="Return to top of page"
        >
          <svg
            className={styles.buttonIcon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
          Back to top
        </button>
      </div>

      {/* Footer information */}
      <div className={styles.footerContainer}>
        <div className={styles.brandContainer}>
          <div className={styles.logoContainer}>
            <Image
              src="/gpt_lab.png"
              alt="News publication logo"
              width={32}
              height={32}
              className={styles.logoImage}
              priority
            />
          </div>
          <div className={styles.brandInfo}>
            <h3 className={styles.brandName}>Your News Source</h3>
            <p className={styles.brandTagline}>Stay informed, stay ahead</p>
          </div>
        </div>

        <div className={styles.timestamp}>
          <p className={styles.lastUpdated}>
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Subtle decorative elements */}
      <div className={styles.decorativePattern}></div>
    </div>
  );
};

export default EndOfNewsComponent;
