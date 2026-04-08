import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { ParsedOrderDraft } from '@/lib/order-ai';

export const dynamic = 'force-dynamic';

const requestSchema = z.object({
    text: z.string().min(1, 'Thiếu nội dung đơn hàng cần phân tích.'),
});

const rawParsedOrderSchema = z.object({
    customerName: z.string().nullable().optional(),
    customerPhone: z.string().nullable().optional(),
    customerAddress: z.string().nullable().optional(),
    shippingFee: z.number().nullable().optional(),
    depositStatus: z.enum(['no_deposit', 'partial_deposit', 'full_deposit']).optional(),
    depositAmount: z.number().nullable().optional(),
    isOldCustomer: z.boolean().nullable().optional(),
    items: z.array(z.object({
        productName: z.string().nullable().optional(),
        quantity: z.number().nullable().optional(),
        note: z.string().nullable().optional(),
    })).optional(),
    notes: z.array(z.string()).optional(),
});

type OpenRouterResponse = {
    choices?: Array<{
        message?: {
            content?: string;
        };
    }>;
};

type OpenRouterErrorPayload = {
    error?: {
        message?: string;
    };
};

function stripCodeFence(content: string) {
    return content
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
}

function normalizeDraft(raw: z.infer<typeof rawParsedOrderSchema>): ParsedOrderDraft {
    return {
        customerName: raw.customerName ?? null,
        customerPhone: raw.customerPhone ?? null,
        customerAddress: raw.customerAddress ?? null,
        shippingFee: raw.shippingFee ?? null,
        depositStatus: raw.depositStatus ?? 'no_deposit',
        depositAmount: raw.depositAmount ?? null,
        isOldCustomer: raw.isOldCustomer ?? null,
        items: (raw.items ?? [])
            .map((item) => ({
                productId: null,
                productName: (item.productName ?? '').trim(),
                quantity: Number.isFinite(item.quantity) && Number(item.quantity) > 0 ? Math.round(Number(item.quantity)) : 1,
                note: item.note ?? null,
            }))
            .filter((item) => item.productName.length > 0),
        notes: raw.notes ?? [],
    };
}

export async function POST(request: Request) {
    try {
        const body = requestSchema.parse(await request.json());
        const apiKey = process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY;
        const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Chưa cấu hình OPENROUTER_API_KEY trong môi trường.' },
                { status: 500 }
            );
        }

        const compactInput = body.text.trim().replace(/\s+/g, ' ');

        const systemPrompt = 'Trich xuat tin nhan dat hang thanh 1 JSON duy nhat. Khong markdown, khong giai thich. Schema: {"customerName":string|null,"customerPhone":string|null,"customerAddress":string|null,"shippingFee":number|null,"depositStatus":"no_deposit"|"partial_deposit"|"full_deposit","depositAmount":number|null,"isOldCustomer":boolean|null,"items":[{"productName":string,"quantity":number,"note":string|null}],"notes":string[]}. Quy tac: thieu thi null; khong co san pham thi items=[]; so luong mac dinh 1; 15k=15000, 1tr=1000000; ck full/full coc=>full_deposit; co coc so tien=>partial_deposit; khach cu/SPX=>isOldCustomer=true.';

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
                'HTTP-Referer': 'http://localhost:3001',
                'X-Title': 'shop-manager',
            },
            body: JSON.stringify({
                model,
                temperature: 0,
                max_tokens: 300,
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: compactInput },
                ],
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let upstreamMessage = 'OpenRouter không phản hồi thành công. Kiểm tra API key hoặc model.';

            try {
                const errorJson = JSON.parse(errorText) as OpenRouterErrorPayload;
                if (errorJson.error?.message) {
                    upstreamMessage = `OpenRouter lỗi: ${errorJson.error.message}`;
                }
            } catch {
                if (errorText.trim()) {
                    upstreamMessage = `OpenRouter lỗi: ${errorText}`;
                }
            }

            console.error('OpenRouter parse request failed:', errorText);
            return NextResponse.json(
                { error: upstreamMessage },
                { status: 502 }
            );
        }

        const openRouterResult = (await response.json()) as OpenRouterResponse;
        const content = openRouterResult.choices?.[0]?.message?.content;

        if (!content) {
            return NextResponse.json(
                { error: 'OpenRouter không trả về nội dung để phân tích.' },
                { status: 502 }
            );
        }

        const parsedJson = JSON.parse(stripCodeFence(content));
        const rawDraft = rawParsedOrderSchema.parse(parsedJson);

        return NextResponse.json(normalizeDraft(rawDraft));
    } catch (error) {
        console.error('Failed to parse order draft with OpenRouter:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Dữ liệu AI trả về không đúng định dạng mong muốn.' },
                { status: 400 }
            );
        }

        if (error instanceof SyntaxError) {
            return NextResponse.json(
                { error: 'AI trả về dữ liệu không đọc được dưới dạng JSON.' },
                { status: 502 }
            );
        }

        return NextResponse.json(
            { error: 'Không thể phân tích nội dung đơn hàng bằng AI.' },
            { status: 500 }
        );
    }
}
