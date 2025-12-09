import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SizingGuideProps {
  title: string;
  headers: string[];
  rows: {
    size: string;
    measurements: string[];
  }[];
}

export default function SizingGuide({
  title,
  headers,
  rows,
}: SizingGuideProps) {
  if (!headers || !rows || headers.length === 0 || rows.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || "Size Guide"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header, index) => (
                <TableHead key={index}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell>{row.size}</TableCell>
                {row.measurements.map((measurement, measurementIndex) => (
                  <TableCell key={measurementIndex}>{measurement}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
