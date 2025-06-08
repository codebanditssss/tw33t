"use client";

import { useLayoutEffect, useRef } from "react";
import type { ComponentProps } from "react";

export function useTextareaResize(
	value: ComponentProps<"textarea">["value"],
	rows = 1,
) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useLayoutEffect(() => {
		const textArea = textareaRef.current;

		if (textArea) {
			// Get the line height to calculate minimum height based on rows
			const computedStyle = window.getComputedStyle(textArea);
			const lineHeight = Number.parseInt(computedStyle.lineHeight, 10) || 20;
			const padding =
				Number.parseInt(computedStyle.paddingTop, 10) +
				Number.parseInt(computedStyle.paddingBottom, 10);

			// Calculate minimum height based on rows
			const minHeight = lineHeight * rows + padding;

			if (!value) {
				// Reset to minimum height when empty
				textArea.style.height = `${minHeight}px`;
				return;
			}

			// Reset height to auto first to get the correct scrollHeight
			textArea.style.height = "auto";
			const scrollHeight = Math.max(textArea.scrollHeight, minHeight);

			// Set the final height
			textArea.style.height = `${scrollHeight}px`;
		}
	}, [textareaRef, value, rows]);

	return textareaRef;
} 