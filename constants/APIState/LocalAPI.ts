import { AppSettings, Global } from 'constants/GlobalValues'
import { Chats, useInference } from 'constants/Chat'
import { Llama, LlamaPreset } from 'constants/LlamaLocal'
import { Logger } from 'constants/Logger'
import { mmkv } from 'constants/MMKV'
import { SamplerID } from 'constants/SamplerData'
import { ModelDataType } from 'db/schema'

import { APIBase, APISampler } from './BaseAPI'

class LocalAPI extends APIBase {
    samplers: APISampler[] = [
        { externalName: 'n_predict', samplerID: SamplerID.GENERATED_LENGTH },
        { externalName: 'temperature', samplerID: SamplerID.TEMPERATURE },
        { externalName: 'top_p', samplerID: SamplerID.TOP_P },
        { externalName: 'top_k', samplerID: SamplerID.TOP_K },
        { externalName: 'min_p', samplerID: SamplerID.MIN_P },
        { externalName: 'typical_p', samplerID: SamplerID.TYPICAL },
        { externalName: 'mirostat', samplerID: SamplerID.MIROSTAT_MODE },
        { externalName: 'mirostat_tau', samplerID: SamplerID.MIROSTAT_TAU },
        { externalName: 'mirostat_eta', samplerID: SamplerID.MIROSTAT_ETA },
        { externalName: 'grammar', samplerID: SamplerID.GRAMMAR_STRING },
        { externalName: 'penalty_last_n', samplerID: SamplerID.REPETITION_PENALTY_RANGE },
        { externalName: 'penalty_repeat', samplerID: SamplerID.REPETITION_PENALTY },
        { externalName: 'penalty_present', samplerID: SamplerID.PRESENCE_PENALTY },
        { externalName: 'penalty_freq', samplerID: SamplerID.FREQUENCY_PENALTY },
        { externalName: 'xtc_t', samplerID: SamplerID.XTC_THRESHOLD },
        { externalName: 'xtc_p', samplerID: SamplerID.XTC_PROBABILITY },
        { externalName: 'seed', samplerID: SamplerID.SEED },
        { externalName: 'dry_base', samplerID: SamplerID.DRY_BASE },
        { externalName: 'dry_allowed_length', samplerID: SamplerID.DRY_ALLOWED_LENGTH },
        { externalName: 'dry_multiplier', samplerID: SamplerID.DRY_MULTIPLIER },
        { externalName: 'dry_sequence_breakers', samplerID: SamplerID.DRY_SEQUENCE_BREAK },
    ]
    buildPayload = () => {
        const payloadFields = this.getSamplerFields()
        const rep_pen = payloadFields?.['penalty_repeat']
        const n_predict =
            (typeof payloadFields?.['n_predict'] === 'number' && payloadFields?.['n_predict']) || 0

        const localPreset: LlamaPreset = this.getObject(Global.LocalPreset)
        return {
            ...payloadFields,
            penalize_nl: typeof rep_pen === 'number' && rep_pen > 1,
            n_threads: localPreset.threads,
            prompt: this.buildTextCompletionContext(localPreset.context_length - n_predict),
            stop: this.constructStopSequence(),
            emit_partial_completion: true,
        }
    }

    inference = async () => {
        let context = Llama.useLlama.getState().context

        let model: undefined | ModelDataType = undefined

        try {
            const modelString = mmkv.getString(Global.LocalModel)
            if (!modelString) {
                Logger.log('No Auto-Load Model Set', true)
                return
            }
            model = JSON.parse(modelString)
        } catch (e) {
            Logger.log('Failed to Auto-Load Model', true)
        }

        if (model && !context && mmkv.getBoolean(AppSettings.AutoLoadLocal)) {
            const params = this.getObject(Global.LocalPreset)
            if (params) {
                Logger.log(`Auto-loading: ${model.name}`, true)
                await Llama.useLlama.getState().load(model)
                context = Llama.useLlama.getState().context
            }
        }

        if (!context) {
            Logger.log('No Model Loaded', true)
            this.stopGenerating()
            return
        }

        const loadKV =
            mmkv.getBoolean(AppSettings.SaveLocalKV) && !mmkv.getBoolean(Global.LocalSessionLoaded)

        if (loadKV) {
            await Llama.useLlama.getState().loadKV()
            mmkv.set(Global.LocalSessionLoaded, true)
        }

        const replace = RegExp(
            this.constructReplaceStrings()
                .map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
                .join(`|`),
            'g'
        )

        useInference.getState().setAbort(async () => {
            await Llama.useLlama.getState().stopCompletion()
        })

        const payload = this.buildPayload()

        const outputStream = (text: string) => {
            const output = Chats.useChatState.getState().buffer + text
            Chats.useChatState.getState().setBuffer(output.replaceAll(replace, ''))
        }

        const outputCompleted = (text: string) => {
            const regenCache = Chats.useChatState.getState().getRegenCache()
            Chats.useChatState.getState().setBuffer((regenCache + text).replaceAll(replace, ''))
            if (mmkv.getBoolean(AppSettings.PrintContext)) Logger.log(`Completion Output:\n${text}`)
            this.stopGenerating()
        }

        await Llama.useLlama
            .getState()
            .completion(payload, outputStream, outputCompleted)
            .catch((error) => {
                Logger.log(`Failed to generate locally: ${error}`, true)
                this.stopGenerating()
            })
    }
}

const localAPI = new LocalAPI()
export default localAPI
