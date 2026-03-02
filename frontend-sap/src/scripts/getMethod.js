import React, { useState, useEffect, useRef } from "react";
import styles from "../styles/Project.module.css";

const useSelect = (initialCategory, initialTag, categories) => {
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [selectedTag, setSelectedTag] = useState(initialTag);
    const [selectedCategoryTag, setSelectedCategoryTag] = useState("Programming");
    const wrapperRef = useRef(null);
    const wrapperTag = useRef(null);
    const [hasLoaded, setHasLoaded] = useState(false);

    useEffect(() => {
        const wrapper = wrapperRef.current;
        const wrapperTags = wrapperTag.current;
        const selectBtn = wrapper.querySelector(`.${styles.selectBtn}`);
        const options = wrapper.querySelector(`.${styles.options}`);

        function addCategory(selectedCategory) {
            options.innerHTML = "";
            categories.forEach((category) => {
                let isSelected = category.value === selectedCategory ? styles.selected : "";
                let li = document.createElement("li");
                li.textContent = category.display;
                li.className = `${isSelected} ${styles.country}`;
                li.addEventListener("click", () => updateName(category.value, category.display));
                options.appendChild(li);
            });
        }

        function updateName(selectedCategory, selectedCategoryTag) {
            addCategory(selectedCategory);
            wrapper.classList.remove(styles.active);
            selectBtn.firstElementChild.innerText = selectedCategoryTag;
            setSelectedCategory(selectedCategory);
            setSelectedCategoryTag(selectedCategoryTag);
            setSelectedTag(initialTag);

            const takaElementV2 = wrapperTags.querySelectorAll(`[idtag="${selectedCategory}"]`);
            if (takaElementV2) {
                takaElementV2[0].click();
            }
        }
        addCategory(selectedCategory);

        if (!hasLoaded) {
            const takaElements1 = wrapperTags.querySelectorAll(`[idtag="${selectedCategory}"]`);
            if (takaElements1.length > 0) {
                if (takaElements1) {
                    takaElements1[0].click();
                }
                setHasLoaded(true);
            }
        }

        const handleToggle = () => {
            wrapper.classList.toggle(styles.active);
        };
        selectBtn.addEventListener("click", handleToggle);
        return () => {
            selectBtn.removeEventListener("click", handleToggle);
        };
    }, [selectedCategory, initialTag, categories, wrapperTag, hasLoaded]);
    return [selectedCategory, selectedTag, setSelectedTag, selectedCategoryTag, wrapperRef, wrapperTag];
};

export default useSelect;