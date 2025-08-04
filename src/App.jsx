import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Bot, 
  User, 
  Code, 
  Globe, 
  FileText, 
  Brain,
  Cpu,
  Zap,
  Shield,
  MessageSquare,
  Terminal,
  Eye,
  Activity
} from 'lucide-react'
import axios from 'axios'

const AgentIcon = ({ type }) => {
  const icons = {
    casual_agent: MessageSquare,
    code_agent: Code,
    browser_agent: Globe,
    file_agent: FileText,
    planner_agent: Brain,
    mcp_agent: Zap
  }
  
  const Icon = icons[type] || Bot
  return <Icon className="w-4 h-4" />
}

const StatusIndicator = ({ isOnline, isGenerating }) => (
  <div className="flex items-center gap-2">
    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} ${isGenerating ? 'animate-pulse' : ''}`} />
    <span className="text-sm text-dark-400">
      {isGenerating ? 'Generating...' : isOnline ? 'Online' : 'Offline'}
    </span>
  </div>
)

const MessageBubble = ({ message, isUser }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
  >
    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
      isUser ? 'bg-primary-600' : 'bg-dark-700'
    }`}>
      {isUser ? <User className="w-4 h-4" /> : <AgentIcon type={message.agentType} />}
    </div>
    
    <div className={`max-w-[80%] ${isUser ? 'text-right' : 'text-left'}`}>
      {!isUser && message.agentName && (
        <div className="text-xs text-dark-400 mb-1 flex items-center gap-1">
          <AgentIcon type={message.agentType} />
          {message.agentName}
        </div>
      )}
      
      <div className={`rounded-2xl px-4 py-3 ${
        isUser 
          ? 'bg-primary-600 text-white' 
          : 'glass-effect text-dark-100'
      }`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>
      
      {message.timestamp && (
        <div className="text-xs text-dark-500 mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      )}
    </div>
  </motion.div>
)

const CodeBlock = ({ block }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="glass-effect rounded-lg p-4 mb-4"
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Terminal className="w-4 h-4 text-primary-400" />
        <span className="text-sm font-medium text-dark-300">
          {block.tool_type}
        </span>
      </div>
      <div className={`px-2 py-1 rounded-full text-xs ${
        block.success 
          ? 'bg-green-500/20 text-green-400' 
          : 'bg-red-500/20 text-red-400'
      }`}>
        {block.success ? 'Success' : 'Failed'}
      </div>
    </div>
    
    <pre className="bg-dark-900 rounded-lg p-3 text-sm font-mono text-dark-200 overflow-x-auto scrollbar-thin">
      {block.block}
    </pre>
    
    {block.feedback && (
      <div className="mt-3 p-3 bg-dark-800/50 rounded-lg">
        <p className="text-xs text-dark-400">{block.feedback}</p>
      </div>
    )}
  </motion.div>
)

const FeatureCard = ({ icon: Icon, title, description }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="glass-effect rounded-xl p-6 hover:bg-dark-700/30 transition-colors"
  >
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-lg bg-primary-600/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary-400" />
      </div>
      <h3 className="font-semibold text-dark-100">{title}</h3>
    </div>
    <p className="text-sm text-dark-400 leading-relaxed">{description}</p>
  </motion.div>
)

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const [currentView, setCurrentView] = useState('chat')
  const [blocks, setBlocks] = useState({})
  const [screenshot, setScreenshot] = useState(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await axios.get('/api/health')
        setIsOnline(true)
      } catch {
        setIsOnline(false)
      }
    }

    const fetchLatestAnswer = async () => {
      try {
        const response = await axios.get('/api/latest_answer')
        const data = response.data
        
        if (data.answer && data.answer.trim()) {
          const existingMessage = messages.find(msg => 
            msg.content === data.answer && !msg.isUser
          )
          
          if (!existingMessage) {
            setMessages(prev => [...prev, {
              content: data.answer,
              isUser: false,
              agentName: data.agent_name,
              agentType: data.agent_name?.toLowerCase().replace(' ', '_') + '_agent',
              timestamp: new Date().toISOString()
            }])
          }
        }
        
        if (data.blocks) {
          setBlocks(data.blocks)
        }
      } catch (error) {
        console.error('Error fetching latest answer:', error)
      }
    }

    const fetchScreenshot = async () => {
      try {
        const response = await axios.get('/api/screenshot', {
          responseType: 'blob'
        })
        const imageUrl = URL.createObjectURL(response.data)
        setScreenshot(imageUrl)
      } catch (error) {
        console.error('Error fetching screenshot:', error)
      }
    }

    checkHealth()
    const interval = setInterval(() => {
      checkHealth()
      fetchLatestAnswer()
      if (currentView === 'browser') {
        fetchScreenshot()
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [messages, currentView])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = {
      content: input,
      isUser: true,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      await axios.post('/api/query', {
        query: input,
        tts_enabled: false
      })
    } catch (error) {
      console.error('Error sending query:', error)
      setMessages(prev => [...prev, {
        content: 'Error: Failed to process your request. Please try again.',
        isUser: false,
        agentName: 'System',
        agentType: 'error',
        timestamp: new Date().toISOString()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    {
      icon: Shield,
      title: "100% Local & Private",
      description: "Everything runs on your machine. No cloud, no data sharing. Your conversations stay private."
    },
    {
      icon: Globe,
      title: "Smart Web Browsing",
      description: "Autonomously browse the internet, search, read, and extract information hands-free."
    },
    {
      icon: Code,
      title: "Autonomous Coding",
      description: "Write, debug, and run programs in Python, C, Go, Java, and more without supervision."
    },
    {
      icon: Brain,
      title: "Smart Agent Selection",
      description: "Automatically selects the best agent for each task. Like having a team of experts ready."
    },
    {
      icon: Cpu,
      title: "Complex Task Planning",
      description: "Breaks down big tasks into steps and executes them using multiple AI agents."
    },
    {
      icon: Zap,
      title: "Voice-Enabled",
      description: "Clean, fast voice interaction allowing you to talk like it's your personal AI assistant."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Header */}
      <header className="glass-effect border-b border-dark-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">AgenticSeek</h1>
                <p className="text-xs text-dark-400">Local AI Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <StatusIndicator isOnline={isOnline} isGenerating={isLoading} />
              
              <div className="flex bg-dark-800 rounded-lg p-1">
                {[
                  { id: 'chat', label: 'Chat', icon: MessageSquare },
                  { id: 'code', label: 'Code', icon: Terminal },
                  { id: 'browser', label: 'Browser', icon: Eye }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setCurrentView(id)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                      currentView === id
                        ? 'bg-primary-600 text-white'
                        : 'text-dark-400 hover:text-dark-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {currentView === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid lg:grid-cols-3 gap-8"
            >
              {/* Chat Interface */}
              <div className="lg:col-span-2">
                <div className="glass-effect rounded-2xl h-[600px] flex flex-col">
                  <div className="p-6 border-b border-dark-700/50">
                    <h2 className="text-lg font-semibold text-dark-100">Conversation</h2>
                    <p className="text-sm text-dark-400 mt-1">
                      Chat with your local AI assistant
                    </p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 rounded-full bg-primary-600/20 flex items-center justify-center mb-4">
                          <Bot className="w-8 h-8 text-primary-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-dark-200 mb-2">
                          Welcome to AgenticSeek
                        </h3>
                        <p className="text-dark-400 max-w-md">
                          Your local AI assistant is ready. Ask me to code, browse the web, 
                          manage files, or just have a conversation!
                        </p>
                      </div>
                    ) : (
                      messages.map((message, index) => (
                        <MessageBubble
                          key={index}
                          message={message}
                          isUser={message.isUser}
                        />
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-6 border-t border-dark-700/50">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask me anything..."
                        disabled={isLoading || !isOnline}
                        className="flex-1 bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-dark-100 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={isLoading || !isOnline || !input.trim()}
                        className="bg-primary-600 hover:bg-primary-700 disabled:bg-dark-700 disabled:text-dark-500 text-white rounded-xl px-6 py-3 font-medium transition-colors flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Send
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Features Sidebar */}
              <div className="space-y-6">
                <div className="glass-effect rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-dark-100 mb-4">
                    Key Features
                  </h3>
                  <div className="space-y-4">
                    {features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                          <feature.icon className="w-4 h-4 text-primary-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-dark-200 text-sm">{feature.title}</h4>
                          <p className="text-xs text-dark-400 mt-1">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-effect rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-dark-100 mb-4">
                    Example Queries
                  </h3>
                  <div className="space-y-3">
                    {[
                      "Make a snake game in Python",
                      "Search for AI startups in Tokyo",
                      "Find my project files",
                      "Plan a trip to Paris"
                    ].map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setInput(example)}
                        className="w-full text-left p-3 rounded-lg bg-dark-800/50 hover:bg-dark-700/50 transition-colors text-sm text-dark-300 hover:text-dark-100"
                      >
                        "{example}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'code' && (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-effect rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <Terminal className="w-6 h-6 text-primary-400" />
                <h2 className="text-xl font-semibold text-dark-100">Code Execution</h2>
              </div>
              
              {Object.keys(blocks).length > 0 ? (
                <div className="space-y-4">
                  {Object.values(blocks).map((block, index) => (
                    <CodeBlock key={index} block={block} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Terminal className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                  <p className="text-dark-400">No code blocks executed yet</p>
                </div>
              )}
            </motion.div>
          )}

          {currentView === 'browser' && (
            <motion.div
              key="browser"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-effect rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <Eye className="w-6 h-6 text-primary-400" />
                <h2 className="text-xl font-semibold text-dark-100">Browser View</h2>
              </div>
              
              {screenshot ? (
                <div className="rounded-lg overflow-hidden border border-dark-700">
                  <img
                    src={screenshot}
                    alt="Browser Screenshot"
                    className="w-full h-auto"
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <Eye className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                  <p className="text-dark-400">No browser activity yet</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features Grid - Only show on chat view when no messages */}
        {currentView === 'chat' && messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold gradient-text mb-3">
                Powerful AI Capabilities
              </h2>
              <p className="text-dark-400 max-w-2xl mx-auto">
                AgenticSeek combines multiple specialized AI agents to handle complex tasks 
                while keeping everything local and private.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-dark-900/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="glass-effect rounded-2xl p-8 flex items-center gap-4">
              <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-dark-200 font-medium">AI is thinking...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App