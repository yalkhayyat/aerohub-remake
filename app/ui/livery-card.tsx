import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { CircleUserRound, Clock } from "lucide-react";

type LiveryCardProps = {
  title: string;
  description?: string;
  tag: string;
  img: string;
  username: string;
  created_at: string;
};

export default function LiveryCard({
  title,
  description,
  tag,
  img,
  username,
  created_at,
}: LiveryCardProps) {
  return (
    <Card className="h-[460px] flex flex-col justify-between">
      <CardHeader>
        <CardTitle className="flex items-start justify-between w-full">
          <div className="line-clamp-2 mr-2">{title}</div>
          <Badge className="">{tag}</Badge>
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>
      <div>
        <CardContent className="mb-4">
          <div className="relative overflow-hidden h-64 rounded-lg">
            {img ? (
              <Image
                src={img}
                alt={title}
                fill
                className="absolute top-0 left-0 w-full h-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-background/90 flex items-center justify-center">
                <span className="text-gray-500">No Image Available</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex items-center justify-between text-sm w-full">
            <div className="flex items-center max-w-1/3 truncate">
              <CircleUserRound size={18} className="mr-2" />
              {username}
            </div>
            <div className="flex items-cente max-w-1/3 truncate">
              <Clock size={18} className="mr-2" />
              {created_at}
            </div>
          </div>
        </CardFooter>
      </div>
    </Card>
  );
}
