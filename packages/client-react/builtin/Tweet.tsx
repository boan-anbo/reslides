/**
 * Tweet component for React
 * Port of Vue client builtin/Tweet.vue
 *
 * A simple wrapper for embedded Tweet.
 *
 * Usage:
 * <Tweet id="20" />
 */

import { useEffect, useRef, useState } from 'react'
import { isDark } from '../logic/dark'
import { Transform } from './Transform'
import './Tweet.css'

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        createTweet: (id: string, container: HTMLElement, options: object) => Promise<HTMLElement | undefined>
      }
    }
  }
}

export interface TweetProps {
  id: string | number
  scale?: string | number
  conversation?: string
  cards?: 'hidden' | 'visible'
}

export function Tweet({ id, scale, conversation, cards }: TweetProps) {
  const tweetRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [tweetNotFound, setTweetNotFound] = useState(false)

  useEffect(() => {
    let retries = 10

    async function create() {
      if (!window.twttr?.widgets?.createTweet) {
        if (retries <= 0) {
          console.error('Failed to load Twitter widget after 10 retries.')
          return
        }
        retries--
        setTimeout(create, 1000)
        return
      }

      const element = await window.twttr.widgets.createTweet(
        id.toString(),
        tweetRef.current!,
        {
          theme: isDark.value ? 'dark' : 'light',
          conversation: conversation || 'none',
          cards,
        },
      )

      setLoaded(true)
      if (element === undefined) {
        setTweetNotFound(true)
      }
    }

    create()
  }, [id, conversation, cards])

  return (
    <Transform scale={scale || 1}>
      <div ref={tweetRef} className="tweet slidev-tweet">
        {(!loaded || tweetNotFound) && (
          <div className="w-30 h-30 my-10px bg-gray-400 bg-opacity-10 rounded-lg flex opacity-50">
            <div className="m-auto animate-pulse text-4xl">
              <div className="i-carbon:logo-twitter" />
              {tweetNotFound && (
                <span>Could not load tweet with id=&quot;{id}&quot;</span>
              )}
            </div>
          </div>
        )}
      </div>
    </Transform>
  )
}

export default Tweet
