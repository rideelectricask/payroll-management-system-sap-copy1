import React from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

const TagFilter = ({
selectedTags,
tagQuery,
setTagQuery,
menuOpen,
setMenuOpen,
filteredTags,
addTag,
removeTag,
clearAllTags,
inputRef
}) => {
return (
<div className="relative w-full">
{selectedTags.length > 0 && (
<div className="bg-white text-xs flex flex-wrap gap-1 p-2 mb-2 rounded border border-gray-200 shadow-sm max-h-20 overflow-y-auto">
{selectedTags.map((tag) => (
<div
key={tag}
className="inline-flex items-center gap-1 rounded-full py-1 px-2 border border-gray-300 bg-gray-50 text-gray-600 text-xs whitespace-nowrap"
>
<span className="truncate max-w-24">{tag}</span>
<XMarkIcon
className="h-3 w-3 cursor-pointer hover:text-gray-800 transition-colors flex-shrink-0"
onClick={() => removeTag(tag)}
/>
</div>
))}
<div
className="w-full text-right text-gray-400 cursor-pointer hover:text-gray-600 transition-colors text-xs py-1"
onClick={() => {
clearAllTags();
inputRef.current?.focus();
}}
>
Clear all
</div>
</div>
)}

<div className="relative">
<div className="flex items-center gap-2 border border-gray-300 rounded px-3 py-2 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
<MagnifyingGlassIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
<input
ref={inputRef}
type="text"
value={tagQuery}
onChange={(e) => setTagQuery(e.target.value)}
onFocus={() => setMenuOpen(true)}
onBlur={() => setTimeout(() => setMenuOpen(false), 200)}
placeholder="Search tags"
className="flex-1 outline-none bg-transparent text-sm placeholder-gray-400"
/>
</div>

{menuOpen && (
<div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto z-50">
<div className="p-1">
{filteredTags.length > 0 ? (
filteredTags.map((tag) => (
<div
key={tag}
className="p-2 hover:bg-gray-100 cursor-pointer rounded text-sm transition-colors"
onMouseDown={(e) => e.preventDefault()}
onClick={() => addTag(tag)}
>
<span className="truncate block">{tag}</span>
</div>
))
) : (
<div className="p-2 text-gray-500 text-sm">No options available</div>
)}
</div>
</div>
)}
</div>
</div>
);
};

export default React.memo(TagFilter);