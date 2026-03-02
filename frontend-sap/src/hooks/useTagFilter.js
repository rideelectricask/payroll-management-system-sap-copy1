import { useState, useMemo } from 'react';

const ALL_TAGS = ["Blibli", "Zalora", "Merapi", "Sayurbox"];

export const useTagFilter = () => {
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagQuery, setTagQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredTags = useMemo(() => {
    if (!tagQuery.trim()) return ALL_TAGS.filter(tag => !selectedTags.includes(tag));
    
    return ALL_TAGS.filter(
      (tag) =>
        tag.toLowerCase().includes(tagQuery.toLowerCase().trim()) &&
        !selectedTags.includes(tag)
    );
  }, [tagQuery, selectedTags]);

  const addTag = (tag) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
      setTagQuery("");
    }
  };

  const removeTag = (tagToRemove) => {
    setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const clearAllTags = () => {
    setSelectedTags([]);
    setTagQuery("");
  };

  return {
    selectedTags,
    tagQuery,
    setTagQuery,
    menuOpen,
    setMenuOpen,
    filteredTags,
    addTag,
    removeTag,
    clearAllTags,
    ALL_TAGS
  };
};