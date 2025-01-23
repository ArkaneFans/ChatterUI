import DropdownSheet from '@components/input/DropdownSheet'
import MultiDropdownSheet from '@components/input/MultiDropdownSheet'
import SliderInput from '@components/input/SliderInput'
import React, { useState } from 'react'
import { View } from 'react-native'

const data = [
    { label: 'Item 0', value: '1' },
    { label: 'Item 1', value: '1' },
    { label: 'Item 2', value: '2' },
    { label: 'Item 3', value: '3' },
    { label: 'Item 4', value: '4' },
    { label: 'Item 5', value: '5' },
    { label: 'Item 6', value: '6' },
    { label: 'Item 7', value: '7' },
    { label: 'Item 8', value: '8' },
]

const ComponentTest = () => {
    const [selected, setSelected] = useState<typeof data>([])
    const [slider, setSlider] = useState(0)
    return (
        <View style={{ flex: 1, padding: 16 }}>
            <MultiDropdownSheet
                selected={selected}
                data={data}
                labelExtractor={(item) => item.label}
                onChangeValue={(T) => {
                    setSelected(T)
                }}
                modalTitle="Test Selector"
                search
            />
            <SliderInput
                value={slider}
                onValueChange={setSlider}
                label="Slider Test"
                step={1}
                min={0}
                max={30}
                precision={1}
            />
        </View>
    )
}

export default ComponentTest
