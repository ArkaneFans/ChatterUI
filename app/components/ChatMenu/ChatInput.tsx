import { MaterialIcons } from '@expo/vector-icons'
import { useInference } from 'constants/Chat'
import { AppSettings, Characters, Chats, Logger, Style } from 'constants/Global'
import { generateResponse } from 'constants/Inference'
import React, { useState } from 'react'
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'
import { useMMKVBoolean } from 'react-native-mmkv'
import { useShallow } from 'zustand/react/shallow'

const ChatInput = () => {
    const [sendOnEnter, setSendOnEnter] = useMMKVBoolean(AppSettings.SendOnEnter)

    const { addEntry } = Chats.useEntry()

    const { nowGenerating, abortFunction } = useInference((state) => ({
        nowGenerating: state.nowGenerating,
        abortFunction: state.abortFunction,
    }))

    const { charName } = Characters.useCharacterCard(
        useShallow((state) => ({
            charName: state?.card?.name,
        }))
    )

    const { userName } = Characters.useUserCard(
        useShallow((state) => ({ userName: state.card?.name }))
    )

    const [newMessage, setNewMessage] = useState<string>('')

    const abortResponse = async () => {
        Logger.log(`Aborting Generation`)
        if (abortFunction) await abortFunction()
    }

    const handleSend = async () => {
        if (newMessage.trim() !== '') await addEntry(userName ?? '', true, newMessage)
        const swipeId = await addEntry(charName ?? '', false, '')
        setNewMessage((message) => '')
        if (swipeId) generateResponse(swipeId)
    }

    return (
        <View style={styles.inputContainer}>
            <TextInput
                style={styles.input}
                placeholder="Message..."
                placeholderTextColor={Style.getColor('primary-text2')}
                value={newMessage}
                onChangeText={(text) => setNewMessage(text)}
                multiline
                submitBehavior={sendOnEnter ? 'blurAndSubmit' : 'newline'}
                onSubmitEditing={sendOnEnter ? handleSend : undefined}
            />

            {nowGenerating ? (
                <TouchableOpacity style={styles.stopButton} onPress={abortResponse}>
                    <MaterialIcons
                        name="stop"
                        color={Style.getColor('destructive-text1')}
                        size={24}
                    />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                    <MaterialIcons
                        name="send"
                        color={Style.getColor('primary-surface1')}
                        size={24}
                    />
                </TouchableOpacity>
            )}
        </View>
    )
}

export default ChatInput

const styles = StyleSheet.create({
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },

    input: {
        color: Style.getColor('primary-text1'),
        backgroundColor: Style.getColor('primary-surface1'),
        flex: 1,
        borderWidth: 1,
        borderColor: Style.getColor('primary-brand'),
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 8,
    },

    sendButton: {
        borderRadius: 8,
        backgroundColor: Style.getColor('primary-brand'),
        padding: 8,
    },

    stopButton: {
        borderRadius: 8,
        backgroundColor: Style.getColor('destructive-brand'),
        padding: 8,
    },
})
