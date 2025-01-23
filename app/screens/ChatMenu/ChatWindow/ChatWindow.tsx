import { AppSettings, Chats } from '@lib/utils/Global'
import { FlatList, StyleSheet, View } from 'react-native'
import { useMMKVBoolean } from 'react-native-mmkv'

import ChatItem from './ChatItem'

type ListItem = {
    index: number
    key: string
    isLastMessage: boolean
    isGreeting: boolean
}

const ChatWindow = () => {
    const { chat } = Chats.useChat()
    const [autoScroll, setAutoScroll] = useMMKVBoolean(AppSettings.AutoScroll)

    const list: ListItem[] = (chat?.messages ?? [])
        .map((item, index) => ({
            index: index,
            key: item.id.toString(),
            isGreeting: index === 0,
            isLastMessage: !!chat?.messages && index === chat?.messages.length - 1,
        }))
        .reverse()

    const renderItems = ({ item, index }: { item: ListItem; index: number }) => {
        return (
            <ChatItem
                index={item.index}
                isLastMessage={item.isLastMessage}
                isGreeting={item.isGreeting}
            />
        )
    }

    return (
        <View style={styles.chatHistory}>
            <View style={styles.chatHistory}>
                <FlatList
                    style={styles.chatHistory}
                    maintainVisibleContentPosition={
                        autoScroll ? null : { minIndexForVisible: 1, autoscrollToTopThreshold: 50 }
                    }
                    keyboardShouldPersistTaps="handled"
                    removeClippedSubviews={false}
                    inverted
                    windowSize={2}
                    data={list}
                    keyExtractor={(item) => item.key}
                    renderItem={renderItems}
                />
            </View>
        </View>
    )
}

export default ChatWindow

const styles = StyleSheet.create({
    chatHistory: {
        flex: 1,
    },
})
