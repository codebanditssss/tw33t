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
      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Tweet Variations */}
        <div className="space-y-6">
          <TweetVariations 
            tweets={tweets}
            selectedTweet={selectedTweet}
            onSelectTweet={onSelectTweet}
          />
          
          {/* Generate More Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={onGenerateMore}
              className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:opacity-80"
              style={{
                backgroundColor: '#3E3F41',
                color: '#FFFFFF'
              }}
            >
              Generate More Tweets
            </button>
          </div>
        </div>

        {/* Right Side - Twitter Preview */}
        <div>
          <TwitterPreview tweet={selectedTweet} />
        </div>
      </div>
    </div>
  );
}

export { ResultsSection }; 