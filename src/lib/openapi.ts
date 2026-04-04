function schemaRef(name: string) {
  return {
    $ref: `#/components/schemas/${name}`,
  };
}

function jsonContent(schema: Record<string, unknown>) {
  return {
    content: {
      "application/json": {
        schema,
      },
    },
  };
}

function jsonResponse(description: string, schema: Record<string, unknown>) {
  return {
    description,
    ...jsonContent(schema),
  };
}

export function getOpenApiDocument(baseUrl?: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "Lanchonete API",
      version: "1.0.0",
      description:
        "Backend da lanchonete em Next.js App Router, com pedidos web, comandas, dashboard operacional e integracao com WhatsApp.",
    },
    servers: [
      {
        url: baseUrl || "/",
        description: baseUrl ? "Servidor atual" : "Servidor padrao",
      },
    ],
    tags: [
      { name: "Publico", description: "Rotas publicas consumidas pelo site." },
      { name: "Cliente", description: "Rotas ligadas a sessao do cliente." },
      { name: "Pedidos", description: "Fluxo de criacao e consulta de pedidos." },
      { name: "Comandas", description: "Fluxo de comandas do salao." },
      { name: "Dashboard", description: "Operacao interna e gestao." },
      { name: "Menu", description: "Catalogo e estruturas do cardapio." },
      { name: "Frete", description: "Regras e cotacao de entrega." },
      { name: "WhatsApp", description: "Webhook e envio transacional." },
      { name: "Auth", description: "Autenticacao do admin." },
    ],
    components: {
      securitySchemes: {
        adminCookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "lanchonete_admin",
          description: "Sessao do dashboard.",
        },
        customerCookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "lanchonete_customer",
          description: "Sessao curta do cliente validado por telefone.",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                message: { type: "string" },
                details: {},
              },
              required: ["message"],
            },
          },
          required: ["error"],
        },
        PaymentMethod: {
          type: "string",
          enum: [
            "dinheiro",
            "cartao_credito",
            "cartao_debito",
            "pix",
            "outro",
          ],
        },
        OrderType: {
          type: "string",
          enum: ["delivery", "retirada", "local"],
        },
        OrderStatus: {
          type: "string",
          enum: [
            "novo",
            "aceito",
            "em_preparo",
            "pronto",
            "saiu_para_entrega",
            "entregue",
            "fechado",
            "cancelado",
          ],
        },
        VerificationRequestInput: {
          type: "object",
          properties: {
            phone: { type: "string", example: "11999990000" },
            customerName: { type: "string", example: "Cliente Teste" },
          },
          required: ["phone"],
        },
        VerificationConfirmInput: {
          type: "object",
          properties: {
            phone: { type: "string", example: "5511999990000" },
            code: { type: "string", example: "123456" },
            customerName: { type: "string", example: "Cliente Teste" },
          },
          required: ["phone", "code"],
        },
        VerificationRequestResponse: {
          type: "object",
          properties: {
            phone: { type: "string" },
            expiresAt: { type: "string", format: "date-time" },
            delivered: { type: "boolean" },
            provider: { type: "string", enum: ["meta", "development"] },
            devCodePreview: { type: "string", nullable: true },
          },
          required: ["phone", "expiresAt", "delivered", "provider"],
        },
        AddressInput: {
          type: "object",
          properties: {
            street: { type: "string" },
            number: { type: "string" },
            complement: { type: "string", nullable: true },
            neighborhood: { type: "string" },
            city: { type: "string" },
            state: { type: "string", example: "SP" },
            zipCode: { type: "string", nullable: true },
            reference: { type: "string", nullable: true },
          },
          required: ["street", "number", "neighborhood", "city", "state"],
        },
        OrderItemInput: {
          type: "object",
          properties: {
            menuItemId: { type: "string" },
            quantity: { type: "integer", minimum: 1 },
            notes: { type: "string", nullable: true },
            optionItemIds: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["menuItemId", "quantity"],
        },
        DeliveryQuoteInput: {
          type: "object",
          properties: {
            zipCode: { type: "string", nullable: true },
            neighborhood: { type: "string", nullable: true },
            city: { type: "string" },
            state: { type: "string" },
            subtotalAmount: { type: "number", minimum: 0, nullable: true },
          },
          required: ["city", "state"],
        },
        DeliveryQuoteResponse: {
          type: "object",
          properties: {
            serviceable: { type: "boolean" },
            deliveryFeeRuleId: { type: "string" },
            feeAmount: { type: "number" },
            estimatedMinMinutes: { type: "integer", nullable: true },
            estimatedMaxMinutes: { type: "integer", nullable: true },
            rule: {
              type: "object",
              properties: {
                id: { type: "string" },
                label: { type: "string" },
                city: { type: "string" },
                state: { type: "string" },
                neighborhood: { type: "string", nullable: true },
                zipCodeStart: { type: "string", nullable: true },
                zipCodeEnd: { type: "string", nullable: true },
                feeAmount: { type: "number" },
                minimumOrderAmount: { type: "number", nullable: true },
                freeAboveAmount: { type: "number", nullable: true },
              },
              required: ["id", "label", "city", "state", "feeAmount"],
            },
          },
          required: ["serviceable", "deliveryFeeRuleId", "feeAmount", "rule"],
        },
        Category: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            slug: { type: "string" },
            description: { type: "string", nullable: true },
            sortOrder: { type: "integer" },
            isActive: { type: "boolean" },
          },
          required: ["id", "name", "slug", "sortOrder", "isActive"],
        },
        OptionItem: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            slug: { type: "string" },
            priceDelta: { type: "string" },
            isDefault: { type: "boolean" },
            isActive: { type: "boolean" },
            sortOrder: { type: "integer" },
          },
          required: ["id", "name", "slug", "priceDelta", "isDefault", "isActive"],
        },
        OptionGroup: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            slug: { type: "string" },
            description: { type: "string", nullable: true },
            minSelections: { type: "integer" },
            maxSelections: { type: "integer", nullable: true },
            isRequired: { type: "boolean" },
            isActive: { type: "boolean" },
            options: {
              type: "array",
              items: schemaRef("OptionItem"),
            },
          },
          required: ["id", "name", "slug", "minSelections", "isRequired", "isActive"],
        },
        MenuItem: {
          type: "object",
          properties: {
            id: { type: "string" },
            categoryId: { type: "string" },
            name: { type: "string" },
            slug: { type: "string" },
            description: { type: "string", nullable: true },
            imageUrl: { type: "string", nullable: true },
            price: { type: "string" },
            compareAtPrice: { type: "string", nullable: true },
            isActive: { type: "boolean" },
            isFeatured: { type: "boolean" },
            sortOrder: { type: "integer" },
            optionGroups: {
              type: "array",
              items: schemaRef("OptionGroup"),
            },
          },
          required: [
            "id",
            "categoryId",
            "name",
            "slug",
            "price",
            "isActive",
            "isFeatured",
            "sortOrder",
          ],
        },
        CustomerProfile: {
          type: "object",
          properties: {
            id: { type: "string" },
            fullName: { type: "string" },
            phone: { type: "string" },
            whatsappOptIn: { type: "boolean" },
            addresses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  street: { type: "string" },
                  number: { type: "string" },
                  neighborhood: { type: "string" },
                  city: { type: "string" },
                  state: { type: "string" },
                  zipCode: { type: "string", nullable: true },
                },
              },
            },
          },
          required: ["id", "fullName", "phone", "whatsappOptIn"],
        },
        Order: {
          type: "object",
          properties: {
            id: { type: "string" },
            code: { type: "string" },
            channel: { type: "string", enum: ["web", "whatsapp", "local"] },
            type: schemaRef("OrderType"),
            status: schemaRef("OrderStatus"),
            customerName: { type: "string", nullable: true },
            customerPhone: { type: "string", nullable: true },
            subtotalAmount: { type: "string" },
            deliveryFeeAmount: { type: "string" },
            totalAmount: { type: "string" },
            paymentMethod: {
              anyOf: [schemaRef("PaymentMethod"), { type: "null" }],
            },
            notes: { type: "string", nullable: true },
          },
          required: [
            "id",
            "code",
            "channel",
            "type",
            "status",
            "subtotalAmount",
            "deliveryFeeAmount",
            "totalAmount",
          ],
        },
        Comanda: {
          type: "object",
          properties: {
            id: { type: "string" },
            code: { type: "string" },
            qrCodeSlug: { type: "string" },
            name: { type: "string", nullable: true },
            status: schemaRef("OrderStatus"),
            subtotalAmount: { type: "string" },
            totalAmount: { type: "string" },
            paymentMethod: {
              anyOf: [schemaRef("PaymentMethod"), { type: "null" }],
            },
          },
          required: ["id", "code", "qrCodeSlug", "status", "subtotalAmount", "totalAmount"],
        },
        OrderCreateInput: {
          type: "object",
          properties: {
            customerName: { type: "string" },
            customerPhone: { type: "string" },
            type: schemaRef("OrderType"),
            paymentMethod: schemaRef("PaymentMethod"),
            notes: { type: "string", nullable: true },
            items: {
              type: "array",
              items: schemaRef("OrderItemInput"),
            },
            address: {
              anyOf: [schemaRef("AddressInput"), { type: "null" }],
            },
          },
          required: [
            "customerName",
            "customerPhone",
            "type",
            "paymentMethod",
            "items",
          ],
        },
        CategoryInput: {
          type: "object",
          properties: {
            name: { type: "string" },
            slug: { type: "string", nullable: true },
            description: { type: "string", nullable: true },
            sortOrder: { type: "integer", default: 0 },
            isActive: { type: "boolean", default: true },
          },
          required: ["name"],
        },
        MenuItemInput: {
          type: "object",
          properties: {
            categoryId: { type: "string" },
            name: { type: "string" },
            slug: { type: "string", nullable: true },
            description: { type: "string", nullable: true },
            imageUrl: { type: "string", nullable: true },
            price: { type: "number" },
            compareAtPrice: { type: "number", nullable: true },
            isActive: { type: "boolean", default: true },
            isFeatured: { type: "boolean", default: false },
            sortOrder: { type: "integer", default: 0 },
            optionGroupIds: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["categoryId", "name", "price"],
        },
        OptionGroupInput: {
          type: "object",
          properties: {
            name: { type: "string" },
            slug: { type: "string", nullable: true },
            description: { type: "string", nullable: true },
            minSelections: { type: "integer", default: 0 },
            maxSelections: { type: "integer", nullable: true },
            isRequired: { type: "boolean", default: false },
            sortOrder: { type: "integer", default: 0 },
            isActive: { type: "boolean", default: true },
            options: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", nullable: true },
                  name: { type: "string" },
                  slug: { type: "string", nullable: true },
                  description: { type: "string", nullable: true },
                  priceDelta: { type: "number", default: 0 },
                  isDefault: { type: "boolean", default: false },
                  isActive: { type: "boolean", default: true },
                  sortOrder: { type: "integer", default: 0 },
                },
                required: ["name"],
              },
            },
          },
          required: ["name"],
        },
        DeliveryFeeRuleInput: {
          type: "object",
          properties: {
            label: { type: "string" },
            neighborhood: { type: "string", nullable: true },
            city: { type: "string" },
            state: { type: "string" },
            zipCodeStart: { type: "string", nullable: true },
            zipCodeEnd: { type: "string", nullable: true },
            feeAmount: { type: "number" },
            minimumOrderAmount: { type: "number", nullable: true },
            freeAboveAmount: { type: "number", nullable: true },
            estimatedMinMinutes: { type: "integer", nullable: true },
            estimatedMaxMinutes: { type: "integer", nullable: true },
            sortOrder: { type: "integer", default: 0 },
            isActive: { type: "boolean", default: true },
          },
          required: ["label", "city", "state", "feeAmount"],
        },
        OrderStatusTransitionInput: {
          type: "object",
          properties: {
            toStatus: schemaRef("OrderStatus"),
            note: { type: "string", nullable: true },
          },
          required: ["toStatus"],
        },
        CloseComandaInput: {
          type: "object",
          properties: {
            paymentMethod: schemaRef("PaymentMethod"),
          },
          required: ["paymentMethod"],
        },
        AdminLoginInput: {
          type: "object",
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", format: "password" },
          },
          required: ["email", "password"],
        },
        WebhookAck: {
          type: "object",
          properties: {
            received: { type: "boolean" },
          },
          required: ["received"],
        },
      },
    },
    paths: {
      "/api/menu": {
        get: {
          tags: ["Publico", "Menu"],
          summary: "Lista o cardapio publico",
          responses: {
            "200": jsonResponse("Categorias e itens ativos.", {
              type: "object",
              properties: {
                categories: {
                  type: "array",
                  items: schemaRef("Category"),
                },
              },
              required: ["categories"],
            }),
          },
        },
      },
      "/api/customer/verification/request": {
        post: {
          tags: ["Cliente"],
          summary: "Solicita codigo de verificacao via WhatsApp",
          requestBody: {
            required: true,
            ...jsonContent(schemaRef("VerificationRequestInput")),
          },
          responses: {
            "201": jsonResponse("Codigo gerado.", schemaRef("VerificationRequestResponse")),
            "422": jsonResponse("Dados invalidos.", schemaRef("ErrorResponse")),
          },
        },
      },
      "/api/customer/verification/confirm": {
        post: {
          tags: ["Cliente"],
          summary: "Confirma codigo do telefone e abre sessao do cliente",
          requestBody: {
            required: true,
            ...jsonContent(schemaRef("VerificationConfirmInput")),
          },
          responses: {
            "200": jsonResponse("Cliente autenticado.", {
              type: "object",
              properties: {
                customer: schemaRef("CustomerProfile"),
              },
              required: ["customer"],
            }),
            "401": jsonResponse("Codigo invalido.", schemaRef("ErrorResponse")),
            "410": jsonResponse("Codigo expirado.", schemaRef("ErrorResponse")),
          },
        },
      },
      "/api/customer/me": {
        get: {
          tags: ["Cliente"],
          summary: "Retorna o perfil do cliente autenticado",
          security: [{ customerCookieAuth: [] }],
          responses: {
            "200": jsonResponse("Perfil do cliente.", {
              type: "object",
              properties: {
                customer: schemaRef("CustomerProfile"),
              },
              required: ["customer"],
            }),
            "401": jsonResponse("Sessao ausente.", schemaRef("ErrorResponse")),
          },
        },
      },
      "/api/customer/orders": {
        get: {
          tags: ["Cliente", "Pedidos"],
          summary: "Lista o historico do cliente autenticado",
          security: [{ customerCookieAuth: [] }],
          responses: {
            "200": jsonResponse("Historico do cliente.", {
              type: "object",
              properties: {
                customer: schemaRef("CustomerProfile"),
                orders: {
                  type: "array",
                  items: schemaRef("Order"),
                },
              },
              required: ["orders"],
            }),
          },
        },
      },
      "/api/delivery-fee/quote": {
        post: {
          tags: ["Publico", "Frete"],
          summary: "Calcula frete para entrega",
          requestBody: {
            required: true,
            ...jsonContent(schemaRef("DeliveryQuoteInput")),
          },
          responses: {
            "200": jsonResponse("Frete aplicado.", schemaRef("DeliveryQuoteResponse")),
            "422": jsonResponse("Area nao atendida ou abaixo do minimo.", schemaRef("ErrorResponse")),
          },
        },
      },
      "/api/orders": {
        post: {
          tags: ["Cliente", "Pedidos"],
          summary: "Cria pedido web",
          security: [{ customerCookieAuth: [] }],
          requestBody: {
            required: true,
            ...jsonContent(schemaRef("OrderCreateInput")),
          },
          responses: {
            "201": jsonResponse("Pedido criado.", {
              type: "object",
              properties: {
                order: schemaRef("Order"),
              },
              required: ["order"],
            }),
            "403": jsonResponse("Telefone do pedido nao bate com a sessao.", schemaRef("ErrorResponse")),
          },
        },
      },
      "/api/orders/{code}": {
        get: {
          tags: ["Pedidos"],
          summary: "Consulta pedido por codigo",
          security: [{ customerCookieAuth: [] }, { adminCookieAuth: [] }],
          parameters: [
            {
              name: "code",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": jsonResponse("Pedido encontrado.", {
              type: "object",
              properties: {
                order: schemaRef("Order"),
              },
              required: ["order"],
            }),
          },
        },
      },
      "/api/comandas/slug/{slug}": {
        get: {
          tags: ["Comandas"],
          summary: "Busca comanda pelo slug do QR code",
          parameters: [
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": jsonResponse("Comanda encontrada.", {
              type: "object",
              properties: {
                comanda: schemaRef("Comanda"),
              },
              required: ["comanda"],
            }),
          },
        },
      },
      "/api/comandas/{id}": {
        get: {
          tags: ["Comandas"],
          summary: "Detalha uma comanda",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": jsonResponse("Comanda encontrada.", {
              type: "object",
              properties: {
                comanda: schemaRef("Comanda"),
              },
              required: ["comanda"],
            }),
          },
        },
      },
      "/api/comandas/{id}/items": {
        post: {
          tags: ["Comandas"],
          summary: "Adiciona itens a uma comanda",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            ...jsonContent({
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: schemaRef("OrderItemInput"),
                },
              },
              required: ["items"],
            }),
          },
          responses: {
            "201": jsonResponse("Itens adicionados.", {
              type: "object",
              properties: {
                comanda: schemaRef("Comanda"),
              },
              required: ["comanda"],
            }),
          },
        },
      },
      "/api/auth/admin/login": {
        post: {
          tags: ["Auth"],
          summary: "Faz login do admin",
          requestBody: {
            required: true,
            ...jsonContent(schemaRef("AdminLoginInput")),
          },
          responses: {
            "200": jsonResponse("Admin autenticado.", {
              type: "object",
              properties: {
                admin: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    email: { type: "string" },
                    role: { type: "string", enum: ["admin"] },
                  },
                  required: ["id", "email", "role"],
                },
              },
              required: ["admin"],
            }),
            "401": jsonResponse("Credenciais invalidas.", schemaRef("ErrorResponse")),
          },
        },
      },
      "/api/auth/admin/logout": {
        post: {
          tags: ["Auth"],
          summary: "Encerra sessao do admin",
          security: [{ adminCookieAuth: [] }],
          responses: {
            "200": jsonResponse("Sessao encerrada.", {
              type: "object",
              properties: {
                success: { type: "boolean" },
              },
              required: ["success"],
            }),
          },
        },
      },
      "/api/dashboard/orders": {
        get: {
          tags: ["Dashboard", "Pedidos"],
          summary: "Lista pedidos para o dashboard",
          security: [{ adminCookieAuth: [] }],
          parameters: [
            {
              name: "status",
              in: "query",
              required: false,
              schema: schemaRef("OrderStatus"),
            },
            {
              name: "channel",
              in: "query",
              required: false,
              schema: {
                type: "string",
                enum: ["web", "whatsapp", "local"],
              },
            },
            {
              name: "type",
              in: "query",
              required: false,
              schema: schemaRef("OrderType"),
            },
          ],
          responses: {
            "200": jsonResponse("Pedidos listados.", {
              type: "object",
              properties: {
                orders: {
                  type: "array",
                  items: schemaRef("Order"),
                },
              },
              required: ["orders"],
            }),
          },
        },
      },
      "/api/dashboard/orders/{id}": {
        get: {
          tags: ["Dashboard", "Pedidos"],
          summary: "Detalha pedido para operacao",
          security: [{ adminCookieAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": jsonResponse("Pedido detalhado.", {
              type: "object",
              properties: {
                order: schemaRef("Order"),
              },
              required: ["order"],
            }),
          },
        },
      },
      "/api/dashboard/orders/{id}/status": {
        post: {
          tags: ["Dashboard", "Pedidos"],
          summary: "Transiciona o status de um pedido",
          security: [{ adminCookieAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            ...jsonContent(schemaRef("OrderStatusTransitionInput")),
          },
          responses: {
            "200": jsonResponse("Pedido atualizado.", {
              type: "object",
              properties: {
                order: schemaRef("Order"),
              },
              required: ["order"],
            }),
          },
        },
      },
      "/api/dashboard/comandas": {
        get: {
          tags: ["Dashboard", "Comandas"],
          summary: "Lista comandas do salao",
          security: [{ adminCookieAuth: [] }],
          responses: {
            "200": jsonResponse("Comandas listadas.", {
              type: "object",
              properties: {
                commandas: {
                  type: "array",
                  items: schemaRef("Comanda"),
                },
              },
              required: ["commandas"],
            }),
          },
        },
      },
      "/api/dashboard/comandas/{id}/close": {
        post: {
          tags: ["Dashboard", "Comandas"],
          summary: "Fecha uma comanda e registra pagamento",
          security: [{ adminCookieAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            ...jsonContent(schemaRef("CloseComandaInput")),
          },
          responses: {
            "200": jsonResponse("Comanda fechada.", {
              type: "object",
              properties: {
                comanda: schemaRef("Comanda"),
              },
              required: ["comanda"],
            }),
          },
        },
      },
      "/api/menu/categories": {
        get: {
          tags: ["Dashboard", "Menu"],
          summary: "Lista categorias do admin",
          security: [{ adminCookieAuth: [] }],
          responses: {
            "200": jsonResponse("Categorias listadas.", {
              type: "object",
              properties: {
                categories: {
                  type: "array",
                  items: schemaRef("Category"),
                },
              },
              required: ["categories"],
            }),
          },
        },
        post: {
          tags: ["Dashboard", "Menu"],
          summary: "Cria categoria",
          security: [{ adminCookieAuth: [] }],
          requestBody: {
            required: true,
            ...jsonContent(schemaRef("CategoryInput")),
          },
          responses: {
            "201": jsonResponse("Categoria criada.", {
              type: "object",
              properties: {
                category: schemaRef("Category"),
              },
              required: ["category"],
            }),
          },
        },
        patch: {
          tags: ["Dashboard", "Menu"],
          summary: "Atualiza categoria",
          security: [{ adminCookieAuth: [] }],
          requestBody: {
            required: true,
            ...jsonContent({
              allOf: [
                schemaRef("CategoryInput"),
                {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                  },
                  required: ["id"],
                },
              ],
            }),
          },
          responses: {
            "200": jsonResponse("Categoria atualizada.", {
              type: "object",
              properties: {
                category: schemaRef("Category"),
              },
              required: ["category"],
            }),
          },
        },
      },
      "/api/menu/items": {
        get: {
          tags: ["Dashboard", "Menu"],
          summary: "Lista itens do cardapio",
          security: [{ adminCookieAuth: [] }],
          responses: {
            "200": jsonResponse("Itens listados.", {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: schemaRef("MenuItem"),
                },
              },
              required: ["items"],
            }),
          },
        },
        post: {
          tags: ["Dashboard", "Menu"],
          summary: "Cria item de cardapio",
          security: [{ adminCookieAuth: [] }],
          requestBody: {
            required: true,
            ...jsonContent(schemaRef("MenuItemInput")),
          },
          responses: {
            "201": jsonResponse("Item criado.", {
              type: "object",
              properties: {
                item: schemaRef("MenuItem"),
              },
              required: ["item"],
            }),
          },
        },
        patch: {
          tags: ["Dashboard", "Menu"],
          summary: "Atualiza item de cardapio",
          security: [{ adminCookieAuth: [] }],
          requestBody: {
            required: true,
            ...jsonContent({
              allOf: [
                schemaRef("MenuItemInput"),
                {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                  },
                  required: ["id"],
                },
              ],
            }),
          },
          responses: {
            "200": jsonResponse("Item atualizado.", {
              type: "object",
              properties: {
                item: schemaRef("MenuItem"),
              },
              required: ["item"],
            }),
          },
        },
      },
      "/api/menu/option-groups": {
        get: {
          tags: ["Dashboard", "Menu"],
          summary: "Lista grupos de adicionais",
          security: [{ adminCookieAuth: [] }],
          responses: {
            "200": jsonResponse("Grupos listados.", {
              type: "object",
              properties: {
                optionGroups: {
                  type: "array",
                  items: schemaRef("OptionGroup"),
                },
              },
              required: ["optionGroups"],
            }),
          },
        },
        post: {
          tags: ["Dashboard", "Menu"],
          summary: "Cria grupo de adicionais",
          security: [{ adminCookieAuth: [] }],
          requestBody: {
            required: true,
            ...jsonContent(schemaRef("OptionGroupInput")),
          },
          responses: {
            "201": jsonResponse("Grupo criado.", {
              type: "object",
              properties: {
                optionGroup: schemaRef("OptionGroup"),
              },
              required: ["optionGroup"],
            }),
          },
        },
        patch: {
          tags: ["Dashboard", "Menu"],
          summary: "Atualiza grupo de adicionais",
          security: [{ adminCookieAuth: [] }],
          requestBody: {
            required: true,
            ...jsonContent({
              allOf: [
                schemaRef("OptionGroupInput"),
                {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                  },
                  required: ["id"],
                },
              ],
            }),
          },
          responses: {
            "200": jsonResponse("Grupo atualizado.", {
              type: "object",
              properties: {
                optionGroup: schemaRef("OptionGroup"),
              },
              required: ["optionGroup"],
            }),
          },
        },
      },
      "/api/delivery-fee-rules": {
        get: {
          tags: ["Dashboard", "Frete"],
          summary: "Lista regras de frete",
          security: [{ adminCookieAuth: [] }],
          responses: {
            "200": jsonResponse("Regras listadas.", {
              type: "object",
              properties: {
                rules: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      label: { type: "string" },
                      city: { type: "string" },
                      state: { type: "string" },
                      neighborhood: { type: "string", nullable: true },
                      feeAmount: { type: "string" },
                    },
                    required: ["id", "label", "city", "state", "feeAmount"],
                  },
                },
              },
              required: ["rules"],
            }),
          },
        },
        post: {
          tags: ["Dashboard", "Frete"],
          summary: "Cria regra de frete",
          security: [{ adminCookieAuth: [] }],
          requestBody: {
            required: true,
            ...jsonContent(schemaRef("DeliveryFeeRuleInput")),
          },
          responses: {
            "201": jsonResponse("Regra criada.", {
              type: "object",
              properties: {
                rule: {
                  type: "object",
                },
              },
              required: ["rule"],
            }),
          },
        },
        patch: {
          tags: ["Dashboard", "Frete"],
          summary: "Atualiza regra de frete",
          security: [{ adminCookieAuth: [] }],
          requestBody: {
            required: true,
            ...jsonContent({
              allOf: [
                schemaRef("DeliveryFeeRuleInput"),
                {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                  },
                  required: ["id"],
                },
              ],
            }),
          },
          responses: {
            "200": jsonResponse("Regra atualizada.", {
              type: "object",
              properties: {
                rule: {
                  type: "object",
                },
              },
              required: ["rule"],
            }),
          },
        },
      },
      "/api/whatsapp/webhook": {
        get: {
          tags: ["WhatsApp"],
          summary: "Verificacao do webhook da Meta",
          parameters: [
            {
              name: "hub.mode",
              in: "query",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "hub.verify_token",
              in: "query",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "hub.challenge",
              in: "query",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Webhook validado.",
              content: {
                "text/plain": {
                  schema: { type: "string" },
                },
              },
            },
            "403": {
              description: "Token invalido.",
            },
          },
        },
        post: {
          tags: ["WhatsApp"],
          summary: "Recebe eventos da Meta WhatsApp Cloud API",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  additionalProperties: true,
                },
              },
            },
          },
          responses: {
            "200": jsonResponse("Evento processado.", schemaRef("WebhookAck")),
            "401": {
              description: "Assinatura invalida.",
            },
          },
        },
      },
    },
  };
}
