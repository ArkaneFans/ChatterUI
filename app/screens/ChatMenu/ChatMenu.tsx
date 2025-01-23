import CharacterList from '@screens/CharacterMenu/CharacterList'
import { Ionicons } from '@expo/vector-icons'
import { Characters, Chats, Logger, Style } from '@lib/utils/Global'
import { Stack, useFocusEffect } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { BackHandler, Pressable, SafeAreaView, StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { Menu } from 'react-native-popup-menu'
import Animated, { runOnJS, ZoomIn } from 'react-native-reanimated'
import { useShallow } from 'zustand/react/shallow'

import ChatInput from './ChatInput'
import AvatarViewer from './ChatWindow/AvatarViewer'
import ChatWindow from './ChatWindow/ChatWindow'
import ChatsDrawer from './ChatsDrawer'
import OptionsMenu from './OptionsMenu'
import SettingsDrawer from './SettingsDrawer'

const ChatMenu = () => {
    const { unloadCharacter } = Characters.useCharacterCard(
        useShallow((state) => ({
            unloadCharacter: state.unloadCard,
        }))
    )

    const { chat, unloadChat } = Chats.useChat()

    const [showDrawer, setShowDrawer] = useState<boolean>(false)
    const [showChats, setShowChats] = useState<boolean>(false)

    const menuRef = useRef<Menu | null>(null)

    const backAction = () => {
        if (menuRef.current?.isOpen()) {
            menuRef.current.close()
            return true
        }

        if (showChats) {
            setShowChats(false)
            return true
        }

        if (chat) {
            unloadChat()
            unloadCharacter()
            Logger.debug('Returning to primary Menu')
            return true
        }
        BackHandler.exitApp()
    }

    useFocusEffect(
        useCallback(() => {
            BackHandler.removeEventListener('hardwareBackPress', backAction)
            BackHandler.addEventListener('hardwareBackPress', backAction)
            return () => {
                BackHandler.removeEventListener('hardwareBackPress', backAction)
            }
            // eslint-disable-next-line react-compiler/react-compiler
        }, [chat, showDrawer, menuRef.current?.isOpen(), showChats])
    )

    const handleLeftFling = () => {
        if (showDrawer) return setShowDrawer(false)
        if (chat) setShowChats(true)
    }

    const handleRightFlight = () => {
        if (showChats) return setShowChats(false)
        setShowDrawer(true)
    }

    const swipeDrawer = Gesture.Fling()
        .direction(1)
        .onEnd(() => {
            runOnJS(handleRightFlight)()
        })

    const swipeChats = Gesture.Fling()
        .direction(3)
        .onEnd(() => {
            runOnJS(handleLeftFling)()
        })

    const gesture = Gesture.Exclusive(swipeDrawer, swipeChats)

    const headerViewRight = (
        <View style={styles.headerButtonContainer}>
            <Pressable
                style={styles.headerButtonRight}
                onPressIn={() => {
                    setShowChats(!showChats)
                }}>
                {showChats && (
                    <Animated.View entering={ZoomIn}>
                        <Ionicons name="close" size={28} color={Style.getColor('primary-text1')} />
                    </Animated.View>
                )}
                {!showChats && (
                    <Animated.View entering={ZoomIn}>
                        <Ionicons
                            name="chatbox"
                            size={28}
                            color={Style.getColor('primary-text1')}
                        />
                    </Animated.View>
                )}
            </Pressable>
        </View>
    )

    const headerViewLeft = !showChats && (
        <Pressable
            style={styles.headerButtonLeft}
            onPressIn={() => {
                setShowDrawer(!showDrawer)
            }}>
            {showDrawer && (
                <Animated.View entering={ZoomIn}>
                    <Ionicons name="close" size={28} color={Style.getColor('primary-text1')} />
                </Animated.View>
            )}

            {!showDrawer && (
                <Animated.View entering={ZoomIn}>
                    <Ionicons name="menu" size={28} color={Style.getColor('primary-text1')} />
                </Animated.View>
            )}
        </Pressable>
    )

    return (
        <GestureDetector gesture={gesture}>
            <SafeAreaView style={styles.safeArea}>
                <Stack.Screen
                    options={{
                        title: '',
                        headerLeft: () => headerViewLeft,
                        ...(chat ? { headerRight: () => headerViewRight } : {}),
                    }}
                />

                {!chat && <CharacterList showHeader={!showDrawer} />}
                {chat && (
                    <View style={styles.container}>
                        <ChatWindow />
                        <View style={styles.inputContainer}>
                            {/**TODO: This might be bad */}
                            <AvatarViewer />
                            <OptionsMenu menuRef={menuRef} showChats={setShowChats} />
                            <ChatInput />
                        </View>
                    </View>
                )}
                {showDrawer && <SettingsDrawer booleans={[showDrawer, setShowDrawer]} />}
                {showChats && <ChatsDrawer booleans={[showChats, setShowChats]} />}
            </SafeAreaView>
        </GestureDetector>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    safeArea: {
        flex: 1,
        flexDirection: 'row',
    },

    welcometext: {
        justifyContent: 'center',
        margin: 30,
        flex: 1,
        fontSize: 20,
        color: Style.getColor('primary-text1'),
    },

    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginVertical: 8,
        paddingHorizontal: 12,
    },

    optionsButton: {
        paddingBottom: 6,
    },

    headerButtonRight: {
        marginLeft: 20,
        marginRight: 4,
    },

    headerButtonLeft: {
        marginRight: 20,
        padding: 2,
    },

    headerButtonContainer: {
        flexDirection: 'row',
    },
})

export default ChatMenu
