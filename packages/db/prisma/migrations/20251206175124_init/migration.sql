-- CreateEnum
CREATE TYPE "Interest" AS ENUM ('TikTok', 'Video_Gaming', 'Travel', 'Gardening', 'Sports', 'Outdor_Activity', 'Arts_and_crafts', 'Cooking', 'Reading', 'Running', 'Technology', 'Other');

-- CreateEnum
CREATE TYPE "Professions" AS ENUM ('Teacher', 'Doctor', 'Lawyer', 'Engineer', 'Software_Developer', 'Chief', 'Accountant', 'Art_Director', 'Dentist', 'Designer', 'Film_Maker', 'Photographer', 'Farmer', 'Other');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "Other" "Interest"[],
    "aboutMe" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profession" "Professions",

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
