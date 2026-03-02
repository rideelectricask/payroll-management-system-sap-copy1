import React from "react";
import { Link } from "react-router-dom";
import styles from "../../../styles/Index.module.css";

const Button = {
    ButtonV1: (props) => {
        const { children, variant, link, classNameV1 = "", classNameV2 = styles.icon } = props;
        return (
            <li className={styles.navLink}>
                <Link to={link} className={`${classNameV1}`}>
                    <i className={`${variant} ${classNameV2}`}></i>
                    <span className={`${styles.text} ${styles.navText}`}>{children}</span>
                </Link>
            </li>
        );
    },

    ButtonV2: (props) => {
        const { children, variant, link, classNameV2 = styles.icon, isDefault = false } = props;
        return (
            <li className="">
                <a href={`${link}`} target="_blank">
                    <i className={`${variant} ${classNameV2}`}></i>
                    <span className={`${styles.text} ${styles.navText}`}>{children}
                        {isDefault ? (
                            <i className={`${classNameV2}`}>
                                <svg stroke="currentColor" fill="none" strokeWidth="2"
                                    viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                    <polyline points="15 3 21 3 21 9"></polyline>
                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                </svg>
                            </i>
                        ) : null}
                    </span>
                </a>
            </li>
        );
    },
};

export default Button;