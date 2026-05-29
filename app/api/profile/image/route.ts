import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Next.js body size limit for API routes
export const maxDuration = 10;

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { image } = await request.json()

    if (!image || !image.startsWith('data:image')) {
      return NextResponse.json({ error: 'Imagem inválida' }, { status: 400 })
    }

    // A imagem virá já croppada e reduzida (base64 compressado no client-side)
    // Atualiza no banco
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image },
    })

    return NextResponse.json({ success: true, image: updatedUser.image })
  } catch (error) {
    console.error('Error updating profile image:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
