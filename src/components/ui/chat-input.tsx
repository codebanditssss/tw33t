"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTextareaResize } from "@/hooks/use-textarea-resize";
import { ArrowUpIcon } from "lucide-react";
import type React from "react";
import { createContext, useContext } from "react";
import { useState } from "react";

interface ChatInputContextValue {
	value?: string;
	onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
	onSubmit?: () => void;
	loading?: boolean;
	onStop?: () => void;
	variant?: "default" | "unstyled";
	rows?: number;
	placeholder?: string;
}

const ChatInputContext = createContext<ChatInputContextValue>({});

interface ChatInputProps extends Omit<ChatInputContextValue, "variant"> {
	children: React.ReactNode;
	className?: string;
	variant?: "default" | "unstyled";
	rows?: number;
	placeholder?: string;
}

function ChatInput({
	children,
	className,
	variant = "default",
	value,
	onChange,
	onSubmit,
	loading,
	onStop,
	rows = 1,
	placeholder,
}: ChatInputProps) {
	const contextValue: ChatInputContextValue = {
		value,
		onChange,
		onSubmit,
		loading,
		onStop,
		variant,
		rows,
		placeholder,
	};

	return (
		<ChatInputContext.Provider value={contextValue}>
			<div
				className={cn(
					variant === "default" &&
						"flex flex-col w-full p-3 rounded-2xl border backdrop-blur-sm transition-all duration-200",
					variant === "unstyled" && "flex items-start gap-2 w-full",
					"bg-[#252628] border-[#3B3B3D] focus-within:bg-[#252628] focus-within:border-[#3B3B3D]",
					className,
				)}
			>
				{children}
			</div>
		</ChatInputContext.Provider>
	);
}

ChatInput.displayName = "ChatInput";

interface ChatInputTextAreaProps extends React.ComponentProps<typeof Textarea> {
	value?: string;
	onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
	onSubmit?: () => void;
	variant?: "default" | "unstyled";
}

function ChatInputTextArea({
	onSubmit: onSubmitProp,
	value: valueProp,
	onChange: onChangeProp,
	className,
	variant: variantProp,
	...props
}: ChatInputTextAreaProps) {
	const context = useContext(ChatInputContext);
	const value = valueProp ?? context.value ?? "";
	const onChange = onChangeProp ?? context.onChange;
	const onSubmit = onSubmitProp ?? context.onSubmit;
	const rows = context.rows ?? 1;
	const charCount = value.length;
	const maxChars = 280;

	const variant =
		variantProp ?? (context.variant === "default" ? "unstyled" : "default");

	const textareaRef = useTextareaResize(value, rows);
	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (!onSubmit) {
			return;
		}
		if ((e.key === "Enter" && !e.shiftKey) || (e.key === "Enter" && e.ctrlKey)) {
			if (typeof value !== "string" || value.trim().length === 0) {
				return;
			}
			e.preventDefault();
			onSubmit();
		}
	};

	return (
		<div className="relative">
			<Textarea
				ref={textareaRef}
				{...props}
				value={value}
				onChange={onChange}
				onKeyDown={handleKeyDown}
				maxLength={maxChars}
				placeholder={context.placeholder ?? "drop your tweet idea here..."}
				className={cn(
					"max-h-[400px] min-h-[52px] h-auto bg-transparent text-white text-md resize-none overflow-x-hidden transition-all duration-200 pr-24",
					"placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700/50",
					variant === "unstyled" &&
						"border-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none",
					className,
				)}
				style={{
					height: value ? 'auto' : '52px'
				}}
				rows={rows}
			/>
			<div className="absolute right-0 bottom-0 flex items-center gap-2 p-2">
				<span className="text-sm text-gray-500">{charCount}/{maxChars}</span>
				<ChatInputSubmit />
			</div>
		</div>
	);
}

ChatInputTextArea.displayName = "ChatInputTextArea";

interface ChatInputSubmitProps extends React.ComponentProps<typeof Button> {
	onSubmit?: () => void;
	loading?: boolean;
	onStop?: () => void;
}

function ChatInputSubmit({
	onSubmit: onSubmitProp,
	loading: loadingProp,
	onStop: onStopProp,
	className,
	...props
}: ChatInputSubmitProps) {
	const context = useContext(ChatInputContext);
	const loading = loadingProp ?? context.loading;
	const onStop = onStopProp ?? context.onStop;
	const onSubmit = onSubmitProp ?? context.onSubmit;
	const hasContent = typeof context.value === "string" && context.value.trim().length > 0;

	if (loading && onStop) {
		return (
			<Button
				onClick={onStop}
				className={cn(
					"shrink-0 rounded-full p-2 h-8 w-8 flex items-center justify-center",
					"bg-gray-800/80 hover:bg-gray-700/80 border-gray-700/50 transition-all duration-200",
					className,
				)}
				{...props}
			>
				<div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-white"></div>
			</Button>
		);
	}

	return (
		<Button
			className={cn(
				"shrink-0 rounded-full p-2 h-8 w-8 flex items-center justify-center group",
				"bg-transparent hover:bg-gray-800/80 transition-all duration-300",
				hasContent ? "text-white" : "text-gray-500",
				className,
			)}
			disabled={!hasContent}
			onClick={(event) => {
				event.preventDefault();
				if (hasContent) {
					onSubmit?.();
				}
			}}
			{...props}
		>
			<ArrowUpIcon 
				className={cn(
					"w-4 h-4 transition-all duration-300",
					hasContent && "animate-float"
				)}
			/>
		</Button>
	);
}

ChatInputSubmit.displayName = "ChatInputSubmit";

export { ChatInput, ChatInputTextArea, ChatInputSubmit }; 