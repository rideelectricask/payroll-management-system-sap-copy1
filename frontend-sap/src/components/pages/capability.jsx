import React, { useEffect, useState } from "react";
import Footer from "../Layouts/footer";
import Cards from "../Elements/Card/CardComponent";
import useFetch from "../hooks/useFetch";
import { CAPABILITIES_API, CAPABILITIES_TAGS_API } from "@/endpoints";
import Form from "../Elements/Input/form";

const Capability = () => {
    const categories = [
        { display: "Programming", value: "programmers" },
        { display: "Cyber Security", value: "hackers" },
        { display: "UI/UX", value: "designers" },
    ];
    
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    
    const [selectedCategory, setSelectedCategory] = useState("programmers");
    const [selectedCategoryTag, setSelectedCategoryTag] = useState("Programming");
    const [selectedTag, setSelectedTag] = useState(0);
    const [selectedKeyTag, setSelectedKeyTag] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const { data: projects, loading: projectsLoading, error: projectsError, fetchData: fetchProjects } = useFetch(`${CAPABILITIES_API}`, []);
    const { data: datas, loading: Loading, error: Error, fetchData: fetchTags } = useFetch(CAPABILITIES_TAGS_API, []);

    const handleSuccess = (message) => {
        if (message === "successDelete" || message === "successPost") {
            fetchProjects();
        }
    };

    const handleDeleteSuccess = () => handleSuccess("successDelete");
    const handlePostSuccess = () => handleSuccess("successPost");

    useEffect(() => {
        fetchProjects();
        fetchTags(selectedCategory);
    }, [selectedCategory]);

    useEffect(() => {
        if (datas && datas.length > 0) {
            const filteredTags = datas.filter((data) => selectedCategory === data.key);
            if (filteredTags.length > 0 && selectedKeyTag === "") {
                setSelectedKeyTag(filteredTags[0].keyTag);
                setSelectedTag(0);
            }
        }
    }, [datas, selectedCategory]);

    const [isProjectLabelClicked, setIsProjectLabelClicked] = useState(false);
    
    const toggleFormContainer = () => {
        setIsProjectLabelClicked(!isProjectLabelClicked);
        setEditInfo({
            cardKey: null,
            imgTitle: null,
            matchingProject: null,
        });
    };

    const [editInfo, setEditInfo] = useState({
        cardKey: null,
        imgTitle: null,
        matchingProject: null,
    });
    
    const handleEditClick = (cardKey, imgTitle) => {
        const matchingProject = projects.find(project => project._id === cardKey);
        setEditInfo({ cardKey, imgTitle, matchingProject });
        setIsProjectLabelClicked(true);
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category.value);
        setSelectedCategoryTag(category.display);
        setIsDropdownOpen(false);
        setSelectedTag(0);
        setSelectedKeyTag("");
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Form
                onPostSuccess={handlePostSuccess}
                isLabelClicked={isProjectLabelClicked}
                toggleFormContainer={toggleFormContainer}
                editInfo={editInfo}
            />
            
            <main className="flex-1 px-6 py-10 md:px-12 md:py-14 max-w-7xl w-full mx-auto">
                <div className="space-y-10">
                    <div className="flex items-center justify-between gap-6">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                            Capability assessment
                        </h1>
                        {isLoggedIn && (
                            <button
                                onClick={toggleFormContainer}
                                className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gray-900 hover:bg-gray-800 text-white transition-all duration-200 ${isProjectLabelClicked ? 'hidden' : ''}`}
                                aria-label="Add new capability"
                            >
                                <i className="fi fi-rr-rectangle-history-circle-plus text-lg"></i>
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col gap-5">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <div 
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-3 px-5 py-2.5 bg-white rounded-xl cursor-pointer hover:bg-gray-50 transition-colors min-w-[170px] shadow-sm"
                                >
                                    <span className="text-sm font-medium text-gray-800 flex-1">
                                        {selectedCategoryTag}
                                    </span>
                                    <i className={`uil uil-angle-down text-gray-500 transition-transform text-base ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
                                </div>
                                
                                {isDropdownOpen && (
                                    <ul className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-lg z-10 overflow-hidden">
                                        {categories.map((category, index) => (
                                            <li
                                                key={index}
                                                onClick={() => handleCategoryChange(category)}
                                                className={`px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors text-sm ${
                                                    category.value === selectedCategory ? 'bg-gray-50 font-semibold text-gray-900' : 'text-gray-700'
                                                }`}
                                            >
                                                {category.display}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {Loading && (
                                <div className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl shadow-sm">
                                    <div className="w-3.5 h-3.5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin"></div>
                                    <span className="text-sm text-gray-600">Loading...</span>
                                </div>
                            )}

                            {Error && (
                                <div className="px-5 py-2.5 bg-red-50 rounded-xl text-sm text-red-600">
                                    {Error}
                                </div>
                            )}

                            {datas &&
                                datas
                                    .filter((data) => selectedCategory === data.key)
                                    .map((data, index) => (
                                        <button
                                            key={index}
                                            idtag={data.key}
                                            onClick={() => {
                                                setSelectedTag(index);
                                                setSelectedKeyTag(data.keyTag);
                                            }}
                                            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 shadow-sm ${
                                                index === selectedTag && selectedKeyTag === data.keyTag
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {data.tag}
                                        </button>
                                    ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                        {projectsLoading ? (
                            <div className="col-span-full flex items-center justify-center py-20">
                                <div className="text-center space-y-4">
                                    <div className="w-10 h-10 border-3 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
                                    <p className="text-gray-500 text-sm">Loading capabilities...</p>
                                </div>
                            </div>
                        ) : projectsError ? (
                            <div className="col-span-full bg-red-50 rounded-xl px-6 py-4 text-center">
                                <p className="text-red-600 text-sm">{projectsError}</p>
                            </div>
                        ) : (projects || []).filter((project) => selectedKeyTag && project.keyTag.includes(selectedKeyTag)).length === 0 ? (
                            <div className="col-span-full text-center py-20">
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-4">
                                    <i className="fi fi-rr-folder-open text-xl text-gray-400"></i>
                                </div>
                                <p className="text-gray-500 text-sm">No capabilities found</p>
                            </div>
                        ) : (
                            (projects || [])
                                .filter((project) => selectedKeyTag && project.keyTag.includes(selectedKeyTag))
                                .map((project) => (
                                    <Cards.CardV1
                                        key={project._id}
                                        cardKey={project._id}
                                        folder={project.folder}
                                        img={project.img}
                                        imgTitle={project.imgTitle}
                                        childrenV1={project.childrenA}
                                        childrenV2={project.childrenB}
                                        link={project.link}
                                        demo={project.demo}
                                        onDeleteSuccess={handleDeleteSuccess}
                                        onEditClick={handleEditClick}
                                        isLoggedIn={isLoggedIn}
                                    />
                                ))
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Capability;