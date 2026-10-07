import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';

export default function ChatbotWidget({ onPrefillReport }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'bot',
      text: 'Hello! 🌿 I am your EcoCity Waste Management AI. Ask me about garbage segregation, how to report trash, or Eco Coins rewards!',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now().toString(), sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot', { message: text });
      const botReply = res.data?.reply || 'I could not process that request. Please ask about waste management.';
      const newBotMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botReply,
        action: res.data?.action,
        extractedData: res.data?.extractedData,
      };
      setMessages((prev) => [...prev, newBotMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: '🌿 I am your dedicated waste management assistant. Please ensure backend is running or ask any recycling question!',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setIsOpen(true)} activeOpacity={0.85}>
        <MaterialCommunityIcons name="robot-happy" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Chat Modal */}
      <Modal visible={isOpen} animationType="slide" transparent onRequestClose={() => setIsOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.chatContainer}>
            {/* Header */}
            <View style={styles.chatHeader}>
              <View style={styles.headerTitleWrap}>
                <View style={styles.botAvatar}>
                  <MaterialCommunityIcons name="leaf" size={20} color="#10b981" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>EcoCity Waste AI</Text>
                  <Text style={styles.headerSubtitle}>Strictly Waste & Recycling Assistant</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Messages list */}
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.messageBubble,
                    item.sender === 'user' ? styles.userBubble : styles.botBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      item.sender === 'user' ? styles.userText : styles.botText,
                    ]}
                  >
                    {item.text}
                  </Text>
                  {item.action === 'prefill_report' && onPrefillReport && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        setIsOpen(false);
                        onPrefillReport(item.extractedData);
                      }}
                    >
                      <MaterialCommunityIcons name="camera-plus" size={16} color="#fff" />
                      <Text style={styles.actionBtnText}>Fill Report Form</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />

            {loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#10b981" />
                <Text style={styles.loadingText}>EcoCity AI is thinking...</Text>
              </View>
            )}

            {/* Input Bar */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Ask about segregation, bins, rewards..."
                placeholderTextColor="#9ca3af"
                value={input}
                onChangeText={setInput}
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
                onPress={sendMessage}
                disabled={!input.trim() || loading}
              >
                <MaterialCommunityIcons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  chatContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
    display: 'flex',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#059669',
  },
  closeBtn: {
    padding: 4,
  },
  messagesList: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '82%',
    padding: 14,
    borderRadius: 18,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#10b981',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  botText: {
    color: '#1f2937',
  },
  userText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 10,
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#111827',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#d1d5db',
  },
});
