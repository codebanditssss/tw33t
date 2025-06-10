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
		type: 'tweet' | 'thread' | 'reply';
		threadLength?: number;
		threadStyle?: string;
		originalTweet?: string;
	}) => void;
	selectedTab?: string;
}

function ChatInputDemo({ onGenerate, selectedTab = "Tweets" }: ChatInputDemoProps) {
	const [value, setValue] = useState("");
	const [originalTweet, setOriginalTweet] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [selectedTone, setSelectedTone] = useState("professional");
	const [threadLength, setThreadLength] = useState(8);
	const [threadStyle, setThreadStyle] = useState("story");
	const [placeholder, setPlaceholder] = useState("Share your boardroom-ready thought.");

	const threadPlaceholders = [
		"How did you scale your startup to 1M users?",
		"Share your journey from beginner to expert",	
		"Explain blockchain like I'm five",
		"Your top 10 productivity hacks that actually work",
		"The biggest lessons from your failures",
		"A step-by-step guide to mastering your craft"
	];

	const replyPlaceholders = [
		"What's your thoughtful response to this tweet?",
		"Share your perspective on this topic",
		"Add value to this conversation",
		"What insights can you contribute?",
		"How would you engage with this tweet?",
		"What's your take on this discussion?"
	];

	const [threadPlaceholderIndex, setThreadPlaceholderIndex] = useState(0);
	const [replyPlaceholderIndex, setReplyPlaceholderIndex] = useState(0);

	// Rotate placeholders every 3 seconds
	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (selectedTab === "Threads") {
			interval = setInterval(() => {
				setThreadPlaceholderIndex((prev) => (prev + 1) % threadPlaceholders.length);
			}, 3000);
		} else if (selectedTab === "Replies") {
			interval = setInterval(() => {
				setReplyPlaceholderIndex((prev) => (prev + 1) % replyPlaceholders.length);
			}, 3000);
		}
		return () => clearInterval(interval);
	}, [selectedTab]);

	const handleSubmit = () => {
		if (!value.trim()) return;
		
		setIsLoading(true);
		
		if (onGenerate) {
			if (selectedTab === "Threads") {
				onGenerate(value.trim(), selectedTone, {
					type: 'thread',
					threadLength,
					threadStyle
				});
			} else if (selectedTab === "Replies") {
				onGenerate(value.trim(), selectedTone, {
					type: 'reply',
					originalTweet: originalTweet || value.trim()
				});
			} else {
				onGenerate(value.trim(), selectedTone, {
					type: 'tweet'
				});
			}
		}
		
		setTimeout(() => {
			setIsLoading(false);
		}, 500);
	};

	const isThreadMode = selectedTab === "Threads";
	const isReplyMode = selectedTab === "Replies";

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

			{/* Original Tweet Input - Only visible for replies */}
			{isReplyMode && (
				<div className="px-1">
					<div className="space-y-2">
						<label className="block text-sm font-medium text-gray-400">
							Original Tweet
						</label>
						<ChatInput
							variant="default"
							value={originalTweet}
							onChange={(e) => setOriginalTweet(e.target.value)}
							className="backdrop-blur-md"
							placeholder="Paste or type the tweet you want to reply to..."
						>
							<div className="relative">
								<ChatInputTextArea />
							</div>
						</ChatInput>
					</div>
				</div>
			)}
			
			{/* Main Input */}
			<ChatInput
				variant="default"
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onSubmit={handleSubmit}
				loading={isLoading}
				onStop={() => setIsLoading(false)}
				className="backdrop-blur-md"
				placeholder={
					isThreadMode 
						? threadPlaceholders[threadPlaceholderIndex]
						: isReplyMode
							? replyPlaceholders[replyPlaceholderIndex]
							: placeholder
				}
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