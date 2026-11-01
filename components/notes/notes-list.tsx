"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Trash } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

interface Note {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileName: string;
  downloads: number;
  createdAt: string;
  teacher: {
    id: string;
    name: string | null;
    image: string | null;
  };
}