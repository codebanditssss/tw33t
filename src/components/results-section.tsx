import { TweetVariations } from './tweet-variations';
import { TwitterPreview } from './twitter-preview';

interface ResultsSectionProps {
  tweets: string[];
  selectedTweet: string;
  onSelectTweet: (tweet: string) => void;
  onGenerateMore: () => void;
}

function ResultsSection({ tweets, selectedTweet, onSelectTweet, onGenerateMore }: ResultsSectionProps) {
  return (
    <div className="w-full max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Tweet Variations */}
        <div className="min-w-[550px]">
          <TweetVariations 
            tweets={tweets}
            selectedTweet={selectedTweet}
            onSelectTweet={onSelectTweet}
            onGenerateMore={onGenerateMore}
          />
        </div>

        {/* Right Side - Twitter Preview */}
        <div className="min-w-[550px]">
          <TwitterPreview tweet={selectedTweet} />
        </div>
      </div>
    </div>
  );
}

export { ResultsSection }; 