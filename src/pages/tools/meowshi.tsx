import { ArrowDownIcon, InformationCircleIcon } from '@heroicons/react/solid'
import { ChainId, Currency, Token } from '@sushiswap/sdk'
import { MEOW, SURE, XSUSHI } from '../../constants'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import CurrencyInputPanel from '../../features/meowshi/CurrencyInputPanel'
import Head from 'next/head'
import HeaderToggle from '../../features/meowshi/HeaderToggle'
import Image from 'next/image'
import MeowshiButton from '../../features/meowshi/MeowshiButton'
import Typography from '../../components/Typography'
import { t } from '@lingui/macro'
import { e10 } from '../../functions'
import { useLingui } from '@lingui/react'
import useSushiPerXSushi from '../../hooks/useXSushiPerSushi'
import useMeowshiPerXSushi from '../../hooks/useMeowshiPerXSushi'
import NetworkGuard from '../../guards/Network'

export enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

export interface MeowshiState {
  currencies: {
    [Field.INPUT]: Token
    [Field.OUTPUT]: Token
  }
  setCurrency: (x: Token, field: Field) => void
  fields: {
    independentField: Field
    [Field.INPUT]: string | null
    [Field.OUTPUT]: string | null
  }
  handleInput: (x: string, field: Field) => void
  switchCurrencies: () => void
  meow: boolean
}

export default function Meowshi() {
  const { i18n } = useLingui()
  const sushiPerXSushi = useSushiPerXSushi()
  const [meowshiPerXSushi, xSushiPerMeowshi] = useMeowshiPerXSushi()

  const [fields, setFields] = useState({
    independentField: Field.INPUT,
    [Field.INPUT]: '',
    [Field.OUTPUT]: '',
  })

  const [currencies, setCurrencies] = useState({
    [Field.INPUT]: SURE[ChainId.MAINNET],
    [Field.OUTPUT]: MEOW,
  })

  const handleInput = useCallback(
    async (val, field) => {
      setFields((prevState) => {
        const inputRate =
          currencies[Field.INPUT] === XSUSHI
            ? meowshiPerXSushi.mul(e10(5))
            : meowshiPerXSushi.mul(e10(5)).mulDiv(e10(18), sushiPerXSushi.toString().toBigNumber(18))
        const outputRate =
          currencies[Field.OUTPUT] === XSUSHI
            ? xSushiPerMeowshi.div(e10(5))
            : xSushiPerMeowshi.mulDiv(sushiPerXSushi.toString().toBigNumber(18), e10(18)).div(e10(5))

        if (field === Field.INPUT) {
          if (currencies[Field.OUTPUT] === MEOW) {
            return {
              independentField: Field.INPUT,
              [Field.INPUT]: val || prevState[Field.INPUT],
              [Field.OUTPUT]: inputRate.mulDiv((val || prevState[Field.INPUT]).toBigNumber(18), e10(18))?.toFixed(18),
            }
          } else {
            return {
              independentField: Field.INPUT,
              [Field.INPUT]: val || prevState[Field.INPUT],
              [Field.OUTPUT]: outputRate.mulDiv((val || prevState[Field.INPUT]).toBigNumber(18), e10(18))?.toFixed(18),
            }
          }
        } else {
          if (currencies[Field.OUTPUT] === MEOW) {
            return {
              independentField: Field.OUTPUT,
              [Field.INPUT]: (val || prevState[Field.OUTPUT]).toBigNumber(18).mulDiv(e10(18), inputRate)?.toFixed(18),
              [Field.OUTPUT]: val || prevState[Field.OUTPUT],
            }
          } else {
            return {
              independentField: Field.OUTPUT,
              [Field.INPUT]: (val || prevState[Field.OUTPUT]).toBigNumber(18).mulDiv(e10(18), outputRate)?.toFixed(18),
              [Field.OUTPUT]: val || prevState[Field.OUTPUT],
            }
          }
        }
      })
    },
    [currencies, meowshiPerXSushi, sushiPerXSushi, xSushiPerMeowshi]
  )

  const setCurrency = useCallback((currency: Currency, field: Field) => {
    setCurrencies((prevState) => ({
      ...prevState,
      [field]: currency,
    }))
  }, [])

  useEffect(() => {
    handleInput(null, fields.independentField)
  }, [fields.independentField, handleInput])

  const switchCurrencies = useCallback(() => {
    setCurrencies((prevState) => ({
      [Field.INPUT]: prevState[Field.OUTPUT],
      [Field.OUTPUT]: prevState[Field.INPUT],
    }))
  }, [])

  const meowshiState = useMemo<MeowshiState>(
    () => ({
      currencies,
      setCurrency,
      switchCurrencies,
      fields,
      meow: currencies[Field.OUTPUT]?.symbol === 'MEOW',
      handleInput,
    }),
    [currencies, fields, handleInput, setCurrency, switchCurrencies]
  )

  return (
    <>
      <Head>
        <title>Meowshi | SureHive</title>
        <meta key="description" name="description" content="SureHive Meowshi..." />
      </Head>

      <div className="w-full max-w-2xl">
        <div className="z-0 relative mb-[-38px] md:mb-[-54px] ml-0 md:ml-4 flex justify-between gap-6 items-center">
          <div className="min-w-[168px] hidden md:block">
            <Image src="/neon-cat.png" alt="neon-cat" width="168px" height="168px" />
          </div>

          <div className="bg-[rgba(255,255,255,0.04)] p-4 py-2 rounded flex flex-row items-center gap-4 mb-[54px]">
            <InformationCircleIcon width={48} height={48} color="pink" />
            <Typography variant="xs" weight={700}>
              {i18n._(t`MEOW tokens wrap nSURE into SureVault for double yields and can be
              used to vote in special MEOW governor contracts.`)}
            </Typography>
          </div>
        </div>
        <div className="relative grid gap-4 p-4 border-2 rounded z-1 bg-gray-200 shadow-swap border-dark-800">
          <HeaderToggle meowshiState={meowshiState} />
          <CurrencyInputPanel field={Field.INPUT} showMax={true} meowshiState={meowshiState} />
          <div className="relative mt-[-24px] mb-[-24px] ml-[28px] flex items-center">
            <div
              className="inline-flex p-2 border-2 rounded-full cursor-pointer border-dark-900 bg-gray-100"
              onClick={switchCurrencies}
            >
              <ArrowDownIcon width={24} height={24} />
            </div>
            <Typography variant="sm" className="text-secondary ml-[26px]">
              {currencies[Field.INPUT]?.symbol} →{' '}
              {(currencies[Field.INPUT] === SURE[ChainId.MAINNET] ||
                currencies[Field.OUTPUT] === SURE[ChainId.MAINNET]) &&
                ' nSURE → '}
              {currencies[Field.OUTPUT]?.symbol}
            </Typography>
          </div>
          <CurrencyInputPanel field={Field.OUTPUT} showMax={false} meowshiState={meowshiState} />
          <MeowshiButton meowshiState={meowshiState} />
        </div>
      </div>
    </>
  )
}

Meowshi.Guard = NetworkGuard([ChainId.MAINNET])
