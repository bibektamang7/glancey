-- CreateEnum
CREATE TYPE "Interest" AS ENUM ('TikTok', 'Video_Gaming', 'Travel', 'Gardening', 'Sports', 'Outdor_Activity', 'Arts_and_crafts', 'Cooking', 'Reading', 'Running', 'Technology', 'other');

-- CreateEnum
CREATE TYPE "Professions" AS ENUM ('Teacher', 'Doctor', 'Lawyer', 'Engineer', 'Software_Developer', 'Chief', 'Accountant', 'Art_Director', 'Dentist', 'Designer', 'Film_Maker', 'Photographer', 'Farmer', 'other');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "other" "Interest"[],
    "aboutMe" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profession" "Professions" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");
