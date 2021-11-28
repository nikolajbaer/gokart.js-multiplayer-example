import { useEffect, useState,useReducer } from 'preact/hooks'
import { createRef } from 'preact'
import { RTCPeer } from './rtc_peer.js'

export function P2PHost(props) {
  const [conn,setConn] = useState(null)
  const [connState,setConnState] = useState({conn:'unknown',ice:'unknown'})
  const [offer,setOffer] = useState(null)
  const [answer,setAnswer] = useState(null)
  const [chats,addChat] = useReducer((chats,line) => {
    console.log("added chat line",line,"to",chats)
    return [...chats,line]
  },[])

  const acceptAnswerRef = createRef()
  const chatRef = createRef()

  useEffect( () => {
    setConn(new RTCPeer(connState => {
      console.log("new conn state",connState)
      setConnState(connState)
    },
    data => {
      addChat(data.d) 
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
    const txt = chatRef.current.value
    conn.send_data('chat',txt,true)
    addChat(txt)
    chatRef.current.value = ''
  }

  const startGame = () => {
    console.log("TODO")
  }

  const chatLines = chats.map( (l,i) => <div key={i}>{l}</div> )

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
      <div>
        <button disabled={connState.conn!="connected"} onClick={startGame}>Start Game</button>
      </div>
    </>
  )
}
