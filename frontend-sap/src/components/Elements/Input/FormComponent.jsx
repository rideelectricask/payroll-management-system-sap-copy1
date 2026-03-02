import React from "react";
import { useLocation } from "react-router-dom";

const FormComponent = ({
  formState,
  handleSubmit,
  handleTagCheckboxChange,
  toggleFormContainer,
  setFormState,
  imagePreviewUrl,
  fileInputRef
}) => {
  const location = useLocation();
  const selectedTagsCount = formState.tags.filter((tag) => formState.selectedTags.includes(tag.keyTag)).length;

  return (
    <>
      {formState.isActive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">
                {formState._id ? "Edit Item" : "Add New Item"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  toggleFormContainer();
                  setFormState((prevState) => ({
                    ...prevState,
                    isActive: false,
                  }));
                }}
                className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Close"
              >
                <i className="fi fi-tr-circle-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Upload Image
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      name="file"
                      ref={fileInputRef}
                      onChange={(event) => {
                        const file = event.target.files[0];
                        if (file) {
                          setFormState((prevState) => ({
                            ...prevState,
                            image: file,
                            img: URL.createObjectURL(file),
                          }));
                        }
                      }}
                      accept="image/*"
                      className="block w-full text-sm text-gray-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-900 file:text-white hover:file:bg-gray-800 file:cursor-pointer cursor-pointer transition-colors"
                    />
                  </div>
                  {imagePreviewUrl && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 p-2">
                      <img
                        src={imagePreviewUrl}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {location.pathname === "/projects" && (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="title" className="block text-sm font-semibold text-gray-700">
                        Title
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        placeholder="Enter project title..."
                        value={formState.title}
                        onChange={(e) =>
                          setFormState((prevState) => ({
                            ...prevState,
                            title: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 placeholder:text-gray-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="description" className="block text-sm font-semibold text-gray-700">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows="4"
                        placeholder="Enter project description..."
                        value={formState.description}
                        onChange={(e) =>
                          setFormState((prevState) => ({
                            ...prevState,
                            description: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 placeholder:text-gray-400 resize-none"
                      ></textarea>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label htmlFor="link" className="block text-sm font-semibold text-gray-700">
                    Link
                  </label>
                  <input
                    type="text"
                    id="link"
                    name="link"
                    placeholder="https://example.com"
                    value={formState.link}
                    onChange={(e) =>
                      setFormState((prevState) => ({
                        ...prevState,
                        link: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                {location.pathname === "/projects" && (
                  <div className="space-y-2">
                    <label htmlFor="demo" className="block text-sm font-semibold text-gray-700">
                      Demo Link
                    </label>
                    <input
                      type="text"
                      id="demo"
                      name="demo"
                      placeholder="https://demo.example.com"
                      value={formState.demo}
                      onChange={(e) =>
                        setFormState((prevState) => ({
                          ...prevState,
                          demo: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Select Label
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {formState.loadingTags ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                        <div className="w-3.5 h-3.5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-600">Loading...</span>
                      </div>
                    ) : formState.tags && formState.tags.length > 0 ? (
                      Array.from(new Set(formState.tags.map((tag) => tag.key))).map((uniqueKey) =>
                        formState.tags.find((tag) => tag.key === uniqueKey) ? (
                          <label
                            key={uniqueKey}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg cursor-pointer transition-all text-sm font-medium ${
                              uniqueKey === formState.selectedTag
                                ? "bg-gray-900 text-white shadow-md"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            <input
                              type="radio"
                              name="radioGroup"
                              checked={uniqueKey === formState.selectedTag}
                              onChange={() =>
                                setFormState((prevState) => ({
                                  ...prevState,
                                  selectedTag: uniqueKey,
                                }))
                              }
                              className="sr-only"
                            />
                            {uniqueKey}
                          </label>
                        ) : null
                      )
                    ) : (
                      <p className="text-sm text-gray-500">No labels available</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Select Tags {selectedTagsCount > 1 ? `(${selectedTagsCount} selected)` : ""}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {formState.loadingTags ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                        <div className="w-3.5 h-3.5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-600">Loading tags...</span>
                      </div>
                    ) : formState.tags && formState.tags.length > 0 ? (
                      formState.tags
                        .filter((tag) => tag.key === formState.selectedTag)
                        .map((tag) => (
                          <label
                            key={tag.tag}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg cursor-pointer transition-all text-sm font-medium ${
                              formState.selectedTags.includes(tag.keyTag)
                                ? "bg-gray-900 text-white shadow-md"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formState.selectedTags.includes(tag.keyTag)}
                              onChange={() => handleTagCheckboxChange(tag.keyTag)}
                              className="sr-only"
                            />
                            {tag.tag}
                          </label>
                        ))
                    ) : (
                      <p className="text-sm text-gray-500">No tags available</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  type="submit"
                  className="w-full py-3 px-6 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-all text-sm shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={formState.selectedTags.length === 0}
                >
                  {formState._id ? "Update" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default FormComponent;