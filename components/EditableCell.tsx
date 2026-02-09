"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

interface EditableCellProps {
  value: string;
  onSave: (value: string) => void;
}

export function EditableCell({ value, onSave }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onSave(editValue);
    }
  };

  if (!isEditing) {
    return (
      <div
        className="cursor-pointer px-1 py-0.5 rounded hover:bg-muted min-h-[1.5rem] truncate max-w-[200px]"
        onDoubleClick={() => setIsEditing(true)}
        title={value || "Double-click to edit"}
      >
        {value || <span className="text-muted-foreground italic">-</span>}
      </div>
    );
  }

  return (
    <Input
      ref={inputRef}
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") {
          setEditValue(value);
          setIsEditing(false);
        }
      }}
      className="h-7 text-sm min-w-[120px]"
    />
  );
}
