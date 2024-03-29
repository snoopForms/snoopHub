import { debounce } from "lodash";
import { Loader, SearchIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { env } from "@formbricks/lib/env";
import { Input } from "@formbricks/ui/Input";

interface UploadSurveyBgProps {
  handleBgChange: (url: string, bgType: string) => void;
  background: string;
}

interface Image {
  id: string;
  alt_description: string;
  urls: {
    regular: string;
  };
}

export const UploadSurveyBg = ({ handleBgChange, background }: UploadSurveyBgProps) => {
  const inputFocus = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [images, setImages] = useState<Image[]>([]);

  useEffect(() => {
    const fetchData = async (searchQuery: string) => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://api.unsplash.com/search/photos?query=${searchQuery}&client_id=${env.NEXT_PUBLIC_UNSPLASH_API_KEY}&orientation=landscape&w=1920&h=1080`
        );
        const data = await response.json();
        setImages(data.results);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    const debouncedFetchData = debounce(fetchData, 500);

    if (query.trim() !== "") {
      debouncedFetchData(query);
    }

    return () => {
      debouncedFetchData.cancel();
    };
  }, [query, setImages]);

  useEffect(() => {
    inputFocus.current?.focus();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  return (
    <div className="relative mt-2 w-full">
      <div className="relative">
        <SearchIcon className="absolute left-2 top-1/2 h-6 w-4 -translate-y-[50%] text-gray-400" />
        <Input
          value={query}
          onChange={handleChange}
          placeholder="Search free high-resolution photos from Unsplash"
          className="pl-8"
          ref={inputFocus}
        />
      </div>
      <div className="relative mt-4 grid cursor-pointer  grid-cols-3 gap-1">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader />
          </div>
        ) : (
          images.map((image) => (
            <Image
              key={image.id}
              width={300}
              height={200}
              src={images.length > 0 ? image.urls.regular : background}
              alt={image.alt_description}
              onClick={() => handleBgChange(image.urls?.regular, "upload")}
              className="rounded-lg"
            />
          ))
        )}
      </div>
    </div>
  );
};
