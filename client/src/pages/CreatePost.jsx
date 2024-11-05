import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { preview } from "../assets";
import { getRandomPrompt } from "../utils";
import { FormField, Loader } from "../components";

const CreatePost = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    prompt: "",
    photo: "",
  });
  const [generatingImg, setGeneratingImg] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateImage = async () => {
    if (form.prompt) {
      try {
        setGeneratingImg(true);
        const serverUrl =
          import.meta.env.MODE === "development"
            ? import.meta.env.VITE_DEV_SERVER_URL
            : import.meta.env.VITE_PROD_SERVER_URL;
        const response = await fetch(`${serverUrl}/api/v1/dalle`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: form.prompt }),
        });

        const data = await response.json();

        setForm({ ...form, photo: `data:image/jpeg;base64,${data.photo}` });
      } catch (error) {
        console.log(error);
      } finally {
        setGeneratingImg(false);
      }
    } else {
      alert("Please enter a prompt");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.prompt && form.photo) {
      setLoading(true);

      try {
        const serverUrl =
          import.meta.env.MODE === "development"
            ? import.meta.env.VITE_DEV_SERVER_URL
            : import.meta.env.VITE_PROD_SERVER_URL;
        const response = await fetch(`${serverUrl}/api/v1/post`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });

        await response.json();
        if (response.ok) navigate("/");
      } catch (err) {
        console.log("Error:", err);
      } finally {
        setLoading(false);
      }
    } else {
      alert("Please enter a prompt and generate an image");
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSurpriseMe = () => {
    const randomPrompt = getRandomPrompt(form.prompt);
    setForm({ ...form, prompt: randomPrompt });
  };

  return (
    <section className="max-w-7xl mx-auto w-11/12 md:w-10/12  md:translate-x-[-50%] md:translate-y-[-50%] md:top-1/2 md:left-1/2 md:absolute">
      <div>
        <h1 className="font-extrabold text-[#222328] text-[32px]">Create</h1>
        <p className="mt-2 text-[#666e75] text-[16px] max-w[500px]">
          Create imaginative and visually stunning images through DALL-E AI and
          share them with the community
        </p>
      </div>

      <form className="mt-12 max-w-8xl lg:max-w-4/5" onSubmit={handleSubmit}>
        <div className="flex flex-col md:flex-row gap-8 md:gap-20 justify-center items-center">
          <div className="flex flex-col gap-5 md:gap-6 w-full md:w-1/2">
            <FormField
              labelName="Your name"
              type="text"
              name="name"
              placeholder="John Doe"
              value={form.name}
              handleChange={handleChange}
            />
            <FormField
              labelName="Prompt"
              type="text"
              name="prompt"
              placeholder="A plush toy robot sitting against a yellow wall"
              value={form.prompt}
              handleChange={handleChange}
              isSurpriseMe
              handleSurpriseMe={handleSurpriseMe}
            />

            <div className="flex gap-5 justify-center w-full">
              <button
                type="button"
                onClick={generateImage}
                disabled={true}
                className="text-white bg-green-700 disabled:bg-green-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center flex-1"
              >
                {generatingImg ? "Generating..." : "Generate"}
              </button>
              <button
                type="submit"
                className="text-white bg-[#6469ff] font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center flex-1"
              >
                {loading ? "Sharing..." : "Share with community"}
              </button>
            </div>
            <p className="mt-2 text-[#666e75] text-[14px]">
            You can share it with others in the community
          </p>
          </div>

          <div className="relative bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 w-full md:w-auto p-3 flex justify-center items-center">
            {form.photo ? (
              <img
                src={form.photo}
                alt={form.prompt}
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={preview}
                alt="preview"
                className="w-9/12 h-9/12 object-contain opacity-40"
              />
            )}

            {generatingImg && (
              <div className="absolute inset-0 z-0 flex justify-center items-center bg-[rgba(0,0,0,0.5)] rounded-lg">
                <Loader />
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 w-full">
          
          <p className="text-sm text-red-600 font-semibold">
            Currently, the image generation is not working. We will fix it soon.
            You can look at already generated images for now.
          </p>
        </div>
      </form>
    </section>
  );
};

export default CreatePost;
