import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { PROJECTS_API, CAPABILITIES_API, CAPABILITIES_TAGS_API, PROJECTS_TAGS_API } from "@/endpoints";
import { storage } from "../../../Firebase";
import FormComponent from "./FormComponent";

const Form = ({ onPostSuccess, isLabelClicked, toggleFormContainer, editInfo }) => {
    const location = useLocation();
    const fileInputRef = useRef(null);
    const [formState, setFormState] = useState({
        isActive: false,
        loadingTags: false,
        tags: [],
        selectedTag: null,
        selectedTags: [],
        title: "",
        description: "",
        link: "",
        demo: "",
        image: null,
        imageUrl: [],
        img: null,
        imgTitle: null,
        _id: "",
    });

    const imagelistref = ref(storage, "images/");
    const projects = location.pathname === "/projects" ? "projects" : "capabilities";
    const ENDPOINT_API = location.pathname === "/projects" ? PROJECTS_API : CAPABILITIES_API;
    const ENDPOINT_TAGS_API = location.pathname === "/projects" ? PROJECTS_TAGS_API : CAPABILITIES_TAGS_API;

    useEffect(() => {
        const fetchTags = async () => {
            setFormState((prevState) => ({ ...prevState, loadingTags: true }));
            try {
                const response = await fetch(ENDPOINT_TAGS_API);
                const data = await response.json();
                setFormState((prevState) => ({ ...prevState, tags: data }));
            } catch (error) {
                console.error("Error fetching tags:", error);
            } finally {
                setFormState((prevState) => ({ ...prevState, loadingTags: false }));
            }
        };

        const fetchImageUrls = async () => {
            try {
                const response = await listAll(imagelistref);
                const imageUrls = await Promise.all(response.items.map(async (item) => getDownloadURL(item)));
                setFormState((prevState) => ({ ...prevState, imageUrl: [...prevState.imageUrl, ...imageUrls] }));
            } catch (error) {
                console.error("Error fetching image URLs:", error);
            }
        };

        fetchTags();
        fetchImageUrls();
    }, []);

    const uploadFile = async () => {
        const { image } = formState;
        if (!image) return null;

        const imageFileName = `${image.name}-${uuidv4()}`;
        const imageRef = ref(storage, `images/${projects}/${imageFileName}`);

        try {
            await uploadBytes(imageRef, image);
            const url = await getDownloadURL(imageRef);
            return { url, fileName: imageFileName };
        } catch (error) {
            console.error("Error uploading image:", error);
            throw error;
        }
    };

    const handleDelete = async (oldImgTitle) => {
        try {
            const folderRef = ref(storage, `images/${projects}`);
            const oldImageRef = ref(folderRef, oldImgTitle);
            await deleteObject(oldImageRef);
            console.log("Image deleted successfully from Firebase storage.");
        } catch (error) {
            console.error("Error deleting image from Firebase storage:", error);
        }
    };

    useEffect(() => {
        setFormState((prevState) => ({ ...prevState, isActive: isLabelClicked }));
    }, [isLabelClicked]);

    useEffect(() => {
        if (editInfo.cardKey !== null && editInfo.imgTitle !== null && editInfo.matchingProject) {
            const { key, keyTag, folder, img, imgTitle, childrenA, childrenB, link, demo, _id } = editInfo.matchingProject;

            setFormState((prevState) => ({
                ...prevState,
                _id: editInfo.cardKey,
                title: childrenA || "",
                description: childrenB || "",
                link: link || "",
                demo: demo || "",
                img: img || "",
                imgTitle: imgTitle || "",
                key: key || "",
                selectedTags: keyTag ? keyTag : [],
                selectedTag: key,
            }));
        } else {
            setFormState((prevState) => ({
                ...prevState,
                _id: "",
                title: "",
                description: "",
                link: "",
                demo: "",
                img: null,
                imgTitle: null,
                key: "",
                selectedTag: null,
                selectedTags: [],
            }));
        }
    }, [editInfo]);

    const imagePreviewUrl = formState.img || "";

    const handleTagCheckboxChange = (tagKey) => {
        setFormState((prevState) => ({
            ...prevState,
            selectedTags: prevState.selectedTags.includes(tagKey)
                ? prevState.selectedTags.filter((prevTag) => prevTag !== tagKey)
                : [...prevState.selectedTags, tagKey],
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const { selectedTags, _id } = formState;

            if (selectedTags.length > 0) {
                const imageUrl = await uploadFile();
                const tagsData = formState.tags
                    .filter((tag) => selectedTags.includes(tag.keyTag))
                    .map((tag) => tag.keyTag);

                if (_id) {
                    const selectedTag = selectedTags[0];
                    const tag = formState.tags.find((tag) => tag.keyTag === selectedTag);

                    if (!tag) {
                        console.error(`Tag not found for keyTag: ${selectedTag}`);
                        return;
                    }

                    const formData = {
                        key: tag.key || "",
                        keyTag: tagsData,
                        folder: projects,
                        img: imageUrl ? imageUrl.url : (editInfo.matchingProject.img || ""),
                        imgTitle: imageUrl ? imageUrl.fileName : (editInfo.matchingProject.imgTitle || ""),
                        childrenA: formState.title,
                        childrenB: formState.description,
                        link: formState.link,
                        demo: formState.demo,
                    };

                    if (imageUrl) {
                        await handleDelete(editInfo.matchingProject.imgTitle);
                    }

                    await fetch(`${ENDPOINT_API}/${formState._id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(formData),
                    });
                } else {
                    const selectedTag = selectedTags[0];
                    const tag = formState.tags.find((tag) => tag.keyTag === selectedTag);

                    if (!tag) {
                        console.error(`Tag not found for keyTag: ${selectedTag}`);
                        return;
                    }

                    const formData = {
                        key: tag.key || "",
                        keyTag: tagsData,
                        folder: projects,
                        img: imageUrl ? imageUrl.url : "",
                        imgTitle: imageUrl ? imageUrl.fileName : "",
                        childrenA: formState.title,
                        childrenB: formState.description,
                        link: formState.link,
                        demo: formState.demo,
                    };

                    const response = await fetch(ENDPOINT_API, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(formData),
                    });

                    if (!response.ok) {
                        console.error(`Failed to save data to MongoDB database.`);
                    }
                }

                setFormState((prevState) => ({
                    ...prevState,
                    image: null,
                }));

                if (fileInputRef.current) {
                    fileInputRef.current.value = null;
                }

                setFormState((prevState) => ({
                    ...prevState,
                    title: "",
                    description: "",
                    link: "",
                    demo: "",
                    selectedTag: null,
                    selectedTags: [],
                    img: null,
                }));

                onPostSuccess("successPost");
                console.log("Data saved to MongoDB database successfully.");
            } else {
                alert("Please select at least one tag.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred while processing your request. Please try again later.");
        }
    };

    return (
        <FormComponent
            formState={formState}
            handleSubmit={handleSubmit}
            handleTagCheckboxChange={handleTagCheckboxChange}
            toggleFormContainer={toggleFormContainer}
            setFormState={setFormState}
            imagePreviewUrl={imagePreviewUrl}
            fileInputRef={fileInputRef}
        />
    );
};

export default Form;