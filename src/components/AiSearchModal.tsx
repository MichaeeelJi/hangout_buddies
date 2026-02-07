import { useState } from 'react';
import { X, Sparkles, Search, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Event } from '../types';
import { EventCard } from './EventCard';
import OpenAI from 'openai';

interface AiSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Initialize OpenAI client
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true
}) : null;

export function AiSearchModal({ isOpen, onClose }: AiSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setResults([]);
    setAiAnalysis(null);
    setError(null);

    try {
      if (!openai) {
        throw new Error('OpenAI API key is missing. Please check your .env file and restart the server.');
      }

      // 1. Fetch all events (including today's events)
      const { data: events, error: dbError } = await supabase
        .from('events')
        .select('*, organizer:profiles!events_organizer_id_fkey(full_name, avatar_url)')
        .gte('event_date', new Date().toISOString());

      if (dbError) throw dbError;

      if (!events || events.length === 0) {
        setAiAnalysis("I couldn't find any upcoming events in the database to match against.");
        setLoading(false);
        return;
      }

      // 2. Prepare event summaries for the LLM
      const eventSummaries = events.map((e: Event) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        tags: e.tags,
        category: e.category,
        date: e.event_date
      }));

      // 3. Call OpenAI to rank events
      console.log('Sending to AI:', eventSummaries);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an intelligent event matcher for a social platform called "Hangout Buddies". 
            Your goal is to match a user's natural language request with the available events.
            
            Return a JSON object with:
            1. "matches": an array of EXACT event IDs (strings) from the provided list that match the user's intent.
            2. "reasoning": a short, friendly sentence explaining why you picked these events.
            
            IMPORTANT Rules:
            - Use the EXACT 'id' field provided in the JSON. Do not hallucinate or modify IDs.
            - Be flexible. If the user asks for "sports", include anything physical like hiking, biking, yoga, or basketball.
            - If the user asks for "food", include dining, networking with food, or social events.
            - If nothing fits well, return an empty matches array.
            `
          },
          {
            role: "user",
            content: `User Request: "${query}"
            
            Available Events:
            ${JSON.stringify(eventSummaries)}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const responseContent = completion.choices[0].message.content;
      if (responseContent) {
        console.log('AI Response Raw:', responseContent);
        const result = JSON.parse(responseContent);
        
        let matchedIds = result.matches || [];
        
        // 4. Fallback: If AI returns nothing, try basic keyword matching
        if (matchedIds.length === 0) {
           console.log('AI found no matches, attempting fallback...');
           const tokens = query.toLowerCase().split(/[\s,.]+/).filter(t => t.length > 2);
           matchedIds = events
             .filter(e => {
               const text = `${e.title} ${e.description} ${e.category} ${e.tags?.join(' ')}`.toLowerCase();
               return tokens.some(t => text.includes(t));
             })
             .map(e => e.id);
             
           if (matchedIds.length > 0) {
             setAiAnalysis("I couldn't find a perfect conceptual match, but these events contain keywords you mentioned.");
           }
        } else {
           setAiAnalysis(result.reasoning);
        }

        const sortedEvents = matchedIds
          .map((id: string) => events.find((e: Event) => e.id === id))
          .filter((e: Event | undefined): e is Event => e !== undefined);

        setResults(sortedEvents);
      }

    } catch (err: any) {
      console.error('AI Search error:', err);
      setError(err.message || 'An unexpected error occurred');
      
      // Fallback: Simple keyword search if AI fails
      if (err.message && (err.message.includes('API key') || err.message.includes('401'))) {
         // Do nothing, let the error show
      } else {
         // Maybe fallback logic here? For now, let's just show the error to debug.
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} aria-hidden="true"></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal Panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-indigo-600">
                <Sparkles className="h-6 w-6" />
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  AI Event Discovery
                </h3>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              Describe what you're looking for in your own words. E.g., "I want a relaxing outdoor activity this weekend" or "Meet tech people and eat good food".
            </p>

            <form onSubmit={handleSearch} className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg pl-4 pr-12 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="What's your vibe today?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Search className="h-5 w-5" />
                  )}
                </button>
              </div>
            </form>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-start gap-2 text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {hasSearched && !error && (
              <div className="space-y-4">
                {aiAnalysis && (
                  <div className="bg-indigo-50 text-indigo-700 p-3 rounded-md text-sm flex gap-2 items-start">
                    <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>{aiAnalysis}</p>
                  </div>
                )}
                
                <h4 className="font-medium text-gray-900">
                  {results.length > 0 ? `Found ${results.length} matches` : 'No matches found.'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto p-1">
                  {results.map(event => (
                    <div key={event.id} className="transform scale-95 origin-top-left">
                      <EventCard event={event} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
