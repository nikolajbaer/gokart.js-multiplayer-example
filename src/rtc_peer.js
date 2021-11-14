// Based on https://mac-blog.org.ua/webrtc-one-to-one-without-signaling-server

export class RTCPeer {
  constructor(statusChangeCallback,onDataCallback){
    this.conn = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }) 
    this.conn.ondatachannel = e =>  this.handleDataChannel(e)
    this.conn.onconnectionstatechange = e => this.handleConnectionStateChange(e)
    this.conn.oniceconnectionstatechange = e => this.handleIceConnectionStateChange(e)
    this.statusChangeCallback = statusChangeCallback
    this.onDataCallback = onDataCallback
  }

  handleDataChannel(event){
    console.log("ondatachannel")
    this.channel = event.channel
    this.channel.onmessage = e => this.handleMessage(e)
  }

  handleConnectionStateChange(event){
    this.statusChangeCallback({conn:this.conn.connectionState,ice:this.conn.iceConnectionState})
  }

  handleIceConnectionStateChange(event){
    this.statusChangeCallback({conn:this.conn.connectionState,ice:this.conn.iceConnectionState})
  }

  handleMessage(event){
    console.log("Got Message",event)
    this.onDataCallback(event.data)
  }

  handleIceCandidate(event){
    console.log('Offer',JSON.stringify(this.conn.localDescription))
  }

  async create_offer(){
    this.channel = this.conn.createDataChannel('data')
    this.channel.onmessage = e => this.handleMessage(e)
    this.conn.onicecandidate = e => this.handleIceCandidate(e)
    const offer = await this.conn.createOffer()
    await this.conn.setLocalDescription(offer)
    return offer
  }

  // JSON parsed offer
  async accept_remote_offer(offer){
    await this.conn.setRemoteDescription(offer)
  }

  async create_answer(resolve){
    this.conn.onicecandidate = event => {
      if(!event.candidate){
        resolve(this.conn.localDescription)
      }
    } 
    const answer = await this.conn.createAnswer()
    await this.conn.setLocalDescription(answer)
  }

  // JSON parsed anser
  async accept_answer(answer){
    await this.conn.setRemoteDescription(answer)
  }

  async send_data(data){
    this.channel.send(data)
  }

}