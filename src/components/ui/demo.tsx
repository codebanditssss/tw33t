"use client";

import {
	ChatInput,
	ChatInputSubmit,
	ChatInputTextArea,
} from "@/components/ui/chat-input";
import { ToneSelector } from "@/components/ui/tone-selector";
import { ThreadControls } from "@/components/ui/thread-controls";
import { useState, useEffect } from "react";

interface ChatInputDemoProps {
	onGenerate?: (topic: string, tone: string, options?: {
		type: 'tweet' | 'thread';
		threadLength?: number;
		threadStyle?: string;
	}) => void;
	selectedTab?: string;
}

function ChatInputDemo({ onGenerate, selectedTab = "Tweets" }: ChatInputDemoProps) {
	const [value, setValue] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [selectedTone, setSelectedTone] = useState("professional");
	const [threadLength, setThreadLength] = useState(8);
	const [threadStyle, setThreadStyle] = useState("story");
	const [placeholder, setPlaceholder] = useState("Share your boardroom-ready thought.");

	const threadPlaceholders = [
		"How did you scale your startup to 1M users?",
		"Share your journey from beginner to expert",
		"What's your framework for making tough decisions?",
		"Explain blockchain like I'm five",
		"Your top 10 productivity hacks that actually work",
		"The biggest lessons from your failures",
		"A step-by-step guide to mastering your craft"
	];

	const [threadPlaceholderIndex, setThreadPlaceholderIndex] = useState(0);

	// Rotate thread placeholders every 3 seconds
	useEffect(() => {
		if (selectedTab === "Threads") {
			const interval = setInterval(() => {
				setThreadPlaceholderIndex((prev) => (prev + 1) % threadPlaceholders.length);
			}, 3000);
			return () => clearInterval(interval);
		}
	}, [selectedTab]);

	const handleSubmit = () => {
		if (!value.trim()) return;
		
		setIsLoading(true);
		
		if (onGenerate) {
			const options = selectedTab === "Threads" ? {
				type: 'thread' as const,
				threadLength,
				threadStyle
			} : {
				type: 'tweet' as const
			};
			
			onGenerate(value.trim(), selectedTone, options);
		}
		
		setTimeout(() => {
			setIsLoading(false);
		}, 500);
	};

	const isThreadMode = selectedTab === "Threads";

	return (
		<div className="w-full space-y-8">
			{/* Tone Selector */}
			<div className="px-1">
				<ToneSelector 
					onToneChange={(tone, newPlaceholder) => {
						setSelectedTone(tone);
						setPlaceholder(newPlaceholder);
					}} 
				/>
			</div>
			
			{/* Thread Controls - Only visible for threads */}
			<div className={`transition-all duration-300 ${isThreadMode ? 'h-auto opacity-100' : 'h-0 opacity-0 overflow-hidden'}`}>
				<div className="px-1">
					<ThreadControls 
						onLengthChange={setThreadLength}
						onStyleChange={setThreadStyle}
					/>
				</div>
			</div>
			
			{/* Chat Input */}
			<ChatInput
				variant="default"
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onSubmit={handleSubmit}
				loading={isLoading}
				onStop={() => setIsLoading(false)}
				className="backdrop-blur-md"
				placeholder={isThreadMode ? threadPlaceholders[threadPlaceholderIndex] : placeholder}
			>
				<div className="relative">
					<ChatInputTextArea />
					<div className="absolute bottom-2 right-2">
						<ChatInputSubmit />
					</div>
				</div>
			</ChatInput>
		</div>
	);
}

export { ChatInputDemo }; 