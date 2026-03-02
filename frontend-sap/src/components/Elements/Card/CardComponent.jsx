import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import { PROJECTS_API, CAPABILITIES_API } from "@/endpoints";
import { storage } from "../../../Firebase";
import { ref, listAll, deleteObject } from "firebase/storage";

const imagelistref = ref(storage, "images/");

const CardComponent = {
    CardV1: (props) => {
        const { 
            isLoggedIn, 
            selectedCategory, 
            cardKey, 
            childrenV1, 
            childrenV2, 
            folder, 
            img, 
            imgTitle, 
            link, 
            demo, 
            onDeleteSuccess 
        } = props;
        
        const [imageList, setImageList] = useState([]);
        const [isDeleting, setIsDeleting] = useState(false);
        const [isExpanded, setIsExpanded] = useState(false);
        const [showReadMore, setShowReadMore] = useState(false);
        const location = useLocation();

        const ENDPOINT_API = location.pathname === "/projects" ? PROJECTS_API : CAPABILITIES_API;
        const { data: projects, loading: projectsLoading, error: projectsError, fetchData: fetchProjects } = useFetch(
            `${ENDPOINT_API}`,
            []
        );

        useEffect(() => {
            const fetchImageList = async () => {
                try {
                    const res = await listAll(imagelistref);
                    const folderPromises = res.prefixes.map(async (folderRef) => {
                        const folderRes = await listAll(folderRef);
                        const folderImages = folderRes.items.map((item) => item.name);
                        return { name: folderRef.name, items: folderImages };
                    });
                    const folders = await Promise.all(folderPromises);
                    setImageList(folders);
                } catch (error) {
                    console.error("Error fetching image list:", error);
                }
            };

            fetchProjects();
            fetchImageList();
        }, []);

        useEffect(() => {
            if (childrenV2 && childrenV2.length > 120) {
                setShowReadMore(true);
            }
        }, [childrenV2]);

        const handleDelete = async () => {
            try {
                const confirmDelete = window.confirm("Are you sure you want to delete this item?");
                if (confirmDelete) {
                    setIsDeleting(true);
                    const response = await fetch(`${ENDPOINT_API}/${cardKey}`, {
                        method: "DELETE",
                    });

                    if (response.ok) {
                        const folderRef = ref(storage, `images/${folder}`);
                        const imageRef = ref(folderRef, `${imgTitle}`);
                        await deleteObject(imageRef);
                        onDeleteSuccess("successDelete");
                    } else {
                        console.error("Failed to delete data from the server:", response.status, response.statusText);
                    }
                    setIsDeleting(false);
                }
            } catch (error) {
                console.error("An error occurred during the delete operation:", error.message);
                setIsDeleting(false);
            }
        };

        const handleEdit = () => {
            if (props.onEditClick) {
                props.onEditClick(cardKey, imgTitle);
            }
        };

        const toggleExpand = () => {
            setIsExpanded(!isExpanded);
        };

        return (
            <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                    <a 
                        href={link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block w-full h-full"
                    >
                        <img 
                            src={img} 
                            alt={childrenV1 || `Image ${cardKey}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    </a>
                    
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                        {location.pathname === "/projects" && (
                            <>
                                <a 
                                    href={link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center w-9 h-9 bg-white/95 backdrop-blur-sm rounded-xl hover:bg-white transition-all shadow-sm hover:shadow"
                                    aria-label="View source code"
                                >
                                    {selectedCategory === "programmers" || selectedCategory === "hackers" ? (
                                        <svg 
                                            className="w-4 h-4 text-gray-700" 
                                            stroke="currentColor" 
                                            fill="none" 
                                            strokeWidth="2" 
                                            viewBox="0 0 24 24" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"
                                        >
                                            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                                        </svg>
                                    ) : selectedCategory === "designers" ? (
                                        <svg 
                                            className="w-4 h-4" 
                                            viewBox="0 0 177 255" 
                                            fill="currentColor"
                                        >
                                            <path fillRule="evenodd" clipRule="evenodd" d="M47.7206 95.4082C29.9906 95.4082 15.6176 109.776 15.6176 127.5C15.6176 145.224 29.9906 159.592 47.7206 159.592H80.6912V127.5V95.4082H47.7206ZM128.412 79.7959L129.279 79.7959C147.009 79.7959 161.382 65.4279 161.382 47.7041C161.382 29.9802 147.009 15.6122 129.279 15.6122H96.3088V79.7959L128.412 79.7959ZM155.448 87.602C168.429 79.0765 177 64.3908 177 47.7041C177 21.3578 155.635 0 129.279 0H96.3088H88.5H80.6912H47.7206C21.3652 0 0 21.3578 0 47.7041C0 64.3908 8.57068 79.0765 21.5515 87.602C8.57068 96.1276 0 110.813 0 127.5C0 144.187 8.57067 158.872 21.5515 167.398C8.57067 175.923 0 190.609 0 207.296C0 233.697 21.6358 255 47.9363 255C74.4764 255 96.3088 233.503 96.3088 206.862V175.204V167.398V162.796C104.785 170.505 116.05 175.204 128.412 175.204H129.279C155.635 175.204 177 153.846 177 127.5C177 110.813 168.429 96.1276 155.448 87.602ZM129.279 95.4082L128.412 95.4082C110.682 95.4082 96.3088 109.776 96.3088 127.5C96.3088 145.224 110.682 159.592 128.412 159.592H129.279C147.009 159.592 161.382 145.224 161.382 127.5C161.382 109.776 147.009 95.4082 129.279 95.4082ZM15.6176 207.296C15.6176 189.572 29.9906 175.204 47.7206 175.204H80.6912V206.862C80.6912 224.771 65.9608 239.388 47.9363 239.388C30.1515 239.388 15.6176 224.965 15.6176 207.296ZM80.6912 79.7959H47.7206C29.9906 79.7959 15.6176 65.4279 15.6176 47.7041C15.6176 29.9802 29.9906 15.6122 47.7206 15.6122H80.6912V79.7959Z" />
                                        </svg>
                                    ) : null}
                                </a>

                                <a 
                                    href={demo} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center w-9 h-9 bg-white/95 backdrop-blur-sm rounded-xl hover:bg-white transition-all shadow-sm hover:shadow"
                                    aria-label="View demo"
                                >
                                    <svg 
                                        stroke="currentColor" 
                                        fill="none" 
                                        strokeWidth="2" 
                                        viewBox="0 0 24 24" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        className="w-4 h-4 text-gray-700"
                                    >
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                        <polyline points="15 3 21 3 21 9"></polyline>
                                        <line x1="10" y1="14" x2="21" y2="3"></line>
                                    </svg>
                                </a>
                            </>
                        )}

                        {isLoggedIn && (
                            <>
                                <button
                                    onClick={handleEdit}
                                    className="flex items-center justify-center w-9 h-9 bg-blue-500/95 backdrop-blur-sm rounded-xl hover:bg-blue-600 transition-all shadow-sm hover:shadow"
                                    aria-label="Edit item"
                                >
                                    <i className="fi-tr-pen-square text-white text-sm"></i>
                                </button>

                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex items-center justify-center w-9 h-9 bg-red-500/95 backdrop-blur-sm rounded-xl hover:bg-red-600 transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="Delete item"
                                >
                                    {isDeleting ? (
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <i className="fi-ts-trash-xmark text-white text-sm"></i>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="p-5 space-y-3">
                    {location.pathname === "/projects" ? (
                        <a 
                            href={demo} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block"
                        >
                            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                                {childrenV1}
                            </h3>
                        </a>
                    ) : (
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-snug">
                            {childrenV1}
                        </h3>
                    )}
                    
                    {childrenV2 && (
                        <div className="space-y-2">
                            <p 
                                className={`text-sm text-gray-600 leading-relaxed transition-all duration-300 ${
                                    isExpanded ? 'line-clamp-none' : 'line-clamp-3'
                                }`}
                            >
                                {childrenV2}
                            </p>
                            
                            {showReadMore && (
                                <button
                                    onClick={toggleExpand}
                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors group"
                                >
                                    <span>{isExpanded ? 'Show less' : 'Read more'}</span>
                                    <svg 
                                        className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    },
};

export default CardComponent;