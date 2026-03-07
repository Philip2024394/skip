/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your SkipTheApp verification code 🔐</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>💚 SkipTheApp</Text>
        <Heading style={h1}>Here's your code 🔐</Heading>
        <Text style={text}>Use this code to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Hr style={hr} />
        <Text style={footer}>
          This code expires shortly. Didn't request it? Just ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', 'Space Grotesk', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const brand = { fontSize: '16px', fontWeight: 'bold' as const, color: 'hsl(346, 77%, 58%)', margin: '0 0 24px', letterSpacing: '-0.3px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: 'hsl(350, 30%, 15%)', margin: '0 0 16px', fontFamily: "'Space Grotesk', Arial, sans-serif" }
const text = { fontSize: '15px', color: 'hsl(350, 15%, 45%)', lineHeight: '1.6', margin: '0 0 20px' }
const codeStyle = { fontFamily: "'Space Grotesk', Courier, monospace", fontSize: '28px', fontWeight: 'bold' as const, color: 'hsl(346, 77%, 58%)', margin: '0 0 30px', letterSpacing: '4px' }
const hr = { borderColor: 'hsl(350, 25%, 88%)', margin: '32px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
