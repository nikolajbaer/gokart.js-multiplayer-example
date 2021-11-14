import { useEffect, useState,useReducer } from 'preact/hooks'
import { createRef } from 'preact'

import { RTCPeer } from './rtc_peer.js'

export function Conn(props) {
  const [conn,setConn] = useState(null)
  const [connState,setConnState] = useState({conn:'unknown',ice:'unknown'})
  const [offer,setOffer] = useState(null)
  const [answer,setAnswer] = useState(null)
  const [chats,addChat] = useReducer((chats,line) => {
    console.log("adding chat line",line,"to",chats)
    chats.push(line)
    return chats
  },[])

  const acceptOfferRef = createRef()
  const acceptAnswerRef = createRef()
  const chatRef = createRef()

  useEffect( () => {
    setConn(new RTCPeer(connState => {
      console.log("new conn state",connState)
      setConnState(connState)
    },
    data => {
      addChat(data) 
    }))
  },[])

  const createOffer = ()  => {
    conn.create_offer().then( offer => {
      console.log("Created Offer",offer)
      setOffer(JSON.stringify(offer))
    })
  }

  const acceptOffer = () => {
    conn.accept_remote_offer(JSON.parse(acceptOfferRef.current.value))
    console.log("Accepting Offer")
  }

  const createAnswer = () => {
    console.log("Creating Answer")
    conn.create_answer(desc => {
      setAnswer(JSON.stringify(desc))
    })
  }

  const acceptAnswer = () => {
    console.log("Accepting Answer")
    conn.accept_answer(JSON.parse(acceptAnswerRef.current.value))
  }

  const sendChat = () => {
    conn.send_data(chatRef.current.value)
    chatRef.current.value = ''
  }

  const chatLines = chats.map( (l,i) => <p key={i}>{l}</p> )

  return (
    <>
      <div>
        <span>{connState.conn}</span> | 
        <span>{connState.ice}</span>
      </div>
      <div>
        <button onClick={createOffer}>Create Offer</button>
        <input type="text" value={offer} />
      </div>
      <div>
        <button onClick={acceptOffer}>Accept Offer</button>
        <input type="text" ref={acceptOfferRef} />
      </div>
      <div>
        <button onClick={createAnswer}>Create Answer</button>
        <input type="text" value={answer} />
      </div>
      <div>
        <button onClick={acceptAnswer}>Accept Answer</button>
        <input type="text" ref={acceptAnswerRef} />
      </div>
      <div>
        {chatLines}
      </div>
      <div>
        <input type="text" ref={chatRef} />
        <button onClick={sendChat}>Send</button>
      </div>
    </>
  )
}
