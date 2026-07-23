export const swaggerSchemas = {
    User: {
        type: 'object',
        properties: {
            _id: { type: 'string', example: '60c72b2f9b1d8a23d4891b23' },
            name: { type: 'string', example: 'Muhammad Zain' },
            email: { type: 'string', example: 'zainf2327@gmail.com' },
            phone: { type: 'string', example: '+923001234567' },
            role: { type: 'string', enum: ['patient', 'staff', 'admin'], example: 'patient' },
            isActive: { type: 'boolean', example: true },
            isVerified: { type: 'boolean', example: true },
            googleId: { type: 'string', nullable: true, example: '109283019283019283' },
            googleEmail: { type: 'string', nullable: true, example: 'zainf2327@gmail.com' },
            googleCalendarConnected: { type: 'boolean', example: false },
            walletBalance: { type: 'number', example: 150 },
            createdAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2026-07-23T10:00:00.000Z' },
        },
    },
    FamilyMember: {
        type: 'object',
        properties: {
            _id: { type: 'string', example: '60c72b2f9b1d8a23d4891b24' },
            userId: { type: 'string', example: '60c72b2f9b1d8a23d4891b23' },
            name: { type: 'string', example: 'Ali Zain' },
            dateOfBirth: { type: 'string', format: 'date', example: '1995-05-15' },
            relationship: { type: 'string', example: 'spouse' },
            gender: { type: 'string', enum: ['male', 'female', 'other'], example: 'male' },
            createdAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:00:00.000Z' },
        },
    },
    SubscriptionPlan: {
        type: 'object',
        properties: {
            _id: { type: 'string', example: '60c72b2f9b1d8a23d4891b25' },
            name: { type: 'string', example: 'Family Premium' },
            price: { type: 'number', example: 49 },
            maxFamilyMembers: { type: 'number', example: 4 },
            features: { type: 'array', items: { type: 'string' }, example: ['Free Home Sampling', '10% discount on tests'] },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:00:00.000Z' },
        },
    },
    Subscription: {
        type: 'object',
        properties: {
            _id: { type: 'string', example: '60c72b2f9b1d8a23d4891b26' },
            userId: { type: 'string', example: '60c72b2f9b1d8a23d4891b23' },
            planId: { type: 'string', example: '60c72b2f9b1d8a23d4891b25' },
            status: { type: 'string', enum: ['active', 'cancelled', 'expired'], example: 'active' },
            startDate: { type: 'string', format: 'date-time', example: '2026-07-22T08:00:00.000Z' },
            renewalDate: { type: 'string', format: 'date-time', example: '2026-08-22T08:00:00.000Z' },
            activeFamilyMemberIds: { type: 'array', items: { type: 'string' }, example: ['60c72b2f9b1d8a23d4891b24'] },
            createdAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:00:00.000Z' },
        },
    },
    TestCategory: {
        type: 'object',
        properties: {
            _id: { type: 'string', example: '60c72b2f9b1d8a23d4891b27' },
            name: { type: 'string', example: 'Hematology' },
            description: { type: 'string', example: 'Complete blood count and clotting disorders' },
            createdAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:00:00.000Z' },
        },
    },
    Test: {
        type: 'object',
        properties: {
            _id: { type: 'string', example: '60c72b2f9b1d8a23d4891b28' },
            categoryId: { type: 'string', example: '60c72b2f9b1d8a23d4891b27' },
            name: { type: 'string', example: 'Complete Blood Count (CBC)' },
            description: { type: 'string', example: 'Evaluates overall health and detects a wide range of disorders' },
            price: { type: 'number', example: 15 },
            type: { type: 'string', enum: ['lab', 'radiology'], example: 'lab' },
            preparationInstructions: { type: 'string', example: 'Fasting required for 8 hours' },
            duration: { type: 'string', example: '24 hours' },
            isHomeCollectionAvailable: { type: 'boolean', example: true },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:00:00.000Z' },
        },
    },
    Booking: {
        type: 'object',
        properties: {
            _id: { type: 'string', example: '60c72b2f9b1d8a23d4891b29' },
            patientId: { type: 'string', example: '60c72b2f9b1d8a23d4891b23' },
            forMemberId: { type: 'string', nullable: true, example: null },
            tests: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        testId: { type: 'string', example: '60c72b2f9b1d8a23d4891b28' },
                        name: { type: 'string', example: 'Complete Blood Count (CBC)' },
                        price: { type: 'number', example: 15 },
                    },
                },
            },
            status: {
                type: 'string',
                enum: ['pending_payment', 'scheduled', 'sample_collected', 'in_lab', 'report_ready', 'completed', 'cancelled'],
                example: 'scheduled',
            },
            totalAmount: { type: 'number', example: 15 },
            discountAmount: { type: 'number', example: 0 },
            finalAmount: { type: 'number', example: 15 },
            walletAmountUsed: { type: 'number', example: 0 },
            couponId: { type: 'string', nullable: true, example: null },
            homeSampling: {
                type: 'object',
                properties: {
                    requested: { type: 'boolean', example: true },
                    address: { type: 'string', example: '123 Main St, Lahore' },
                    scheduledAt: { type: 'string', format: 'date-time', example: '2026-07-25T09:00:00.000Z' },
                    assignedStaffId: { type: 'string', nullable: true, example: '60c72b2f9b1d8a23d4891b99' },
                },
            },
            googleCalendar: {
                type: 'object',
                properties: {
                    patientEventId: { type: 'string', nullable: true, example: 'event_patient_123' },
                    staffEventId: { type: 'string', nullable: true, example: 'event_staff_456' },
                },
            },
            notes: { type: 'string', example: 'Fasting patient' },
            createdAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:00:00.000Z' },
        },
    },
    Report: {
        type: 'object',
        properties: {
            _id: { type: 'string', example: '6a5e0723e3a13ac3110d4a8c' },
            bookingId: { type: 'string', example: '60c72b2f9b1d8a23d4891b29' },
            patientId: { type: 'string', example: '60c72b2f9b1d8a23d4891b23' },
            fileUrl: { type: 'string', example: 'https://s3.amazonaws.com/lablink-reports/report.pdf' },
            fileKey: { type: 'string', example: 'reports/report.pdf' },
            mimeType: { type: 'string', example: 'application/pdf' },
            uploadedBy: { type: 'string', example: '60c72b2f9b1d8a23d4891b99' },
            tags: { type: 'array', items: { type: 'string' }, example: ['Hematology', 'CBC'] },
            textContent: { type: 'string', example: 'Patient CBC report results...' },
            vectorized: { type: 'boolean', example: true },
            summary: { type: 'string', example: 'CBC values are within standard reference ranges.' },
            summaryGeneratedAt: { type: 'string', format: 'date-time', nullable: true, example: '2026-07-22T08:10:00.000Z' },
            versionSuffix: { type: 'string', example: 'v1' },
            lastViewedAt: { type: 'string', format: 'date-time', nullable: true, example: '2026-07-22T08:11:00.000Z' },
            accessLog: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        viewedBy: { type: 'string', example: '60c72b2f9b1d8a23d4891b23' },
                        viewedAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:11:00.000Z' },
                        role: { type: 'string', example: 'patient' },
                    },
                },
            },
            createdAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:00:00.000Z' },
        },
    },
    Payment: {
        type: 'object',
        properties: {
            _id: { type: 'string', example: '60c72b2f9b1d8a23d4891b30' },
            bookingId: { type: 'string', nullable: true, example: '60c72b2f9b1d8a23d4891b29' },
            subscriptionPlanId: { type: 'string', nullable: true, example: null },
            subscriptionId: { type: 'string', nullable: true, example: null },
            paymentFor: { type: 'string', enum: ['booking', 'subscription'], example: 'booking' },
            patientId: { type: 'string', example: '60c72b2f9b1d8a23d4891b23' },
            amount: { type: 'number', example: 15 },
            walletAmountUsed: { type: 'number', example: 0 },
            currency: { type: 'string', example: 'usd' },
            method: { type: 'string', enum: ['stripe'], example: 'stripe' },
            stripePaymentIntentId: { type: 'string', example: 'pi_3MtwKsLkdIwHu7ix28a8C' },
            status: { type: 'string', enum: ['pending', 'succeeded', 'failed'], example: 'succeeded' },
            paidAt: { type: 'string', format: 'date-time', nullable: true, example: '2026-07-22T08:05:00.000Z' },
            createdAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:05:00.000Z' },
        },
    },
    Coupon: {
        type: 'object',
        properties: {
            _id: { type: 'string', example: '60c72b2f9b1d8a23d4891b31' },
            code: { type: 'string', example: 'SAVE10' },
            discountType: { type: 'string', enum: ['percentage', 'fixed'], example: 'percentage' },
            discountValue: { type: 'number', example: 10 },
            minOrderValue: { type: 'number', nullable: true, example: 20 },
            maxUses: { type: 'number', nullable: true, example: 100 },
            usedCount: { type: 'number', example: 5 },
            expiresAt: { type: 'string', format: 'date-time', nullable: true, example: '2026-12-31T23:59:59.000Z' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:00:00.000Z' },
        },
    },
    ChatMessage: {
        type: 'object',
        properties: {
            _id: { type: 'string', example: '60c72b2f9b1d8a23d4891b32' },
            reportId: { type: 'string', example: '6a5e0723e3a13ac3110d4a8c' },
            patientId: { type: 'string', example: '60c72b2f9b1d8a23d4891b23' },
            role: { type: 'string', enum: ['user', 'assistant'], example: 'assistant' },
            content: { type: 'string', example: 'Your White Blood Cell count is within normal reference limits.' },
            createdAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:12:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:12:00.000Z' },
        },
    },
    AuditLog: {
        type: 'object',
        properties: {
            _id: { type: 'string', example: '60c72b2f9b1d8a23d4891b33' },
            actorId: { type: 'string', example: '60c72b2f9b1d8a23d4891b23' },
            actorRole: { type: 'string', example: 'admin' },
            action: { type: 'string', example: 'DELETE_REPORT' },
            targetModel: { type: 'string', example: 'Report' },
            targetId: { type: 'string', example: '6a5e0723e3a13ac3110d4a8c' },
            metadata: { type: 'object', example: { reason: 'Incorrect patient file attached' } },
            createdAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:15:00.000Z' },
        },
    },
    WalletTransaction: {
        type: 'object',
        properties: {
            _id: { type: 'string', example: '60c72b2f9b1d8a23d4891b34' },
            userId: { type: 'string', example: '60c72b2f9b1d8a23d4891b23' },
            type: { type: 'string', enum: ['credit', 'debit'], example: 'credit' },
            amount: { type: 'number', example: 50 },
            reason: { type: 'string', enum: ['cancellation_refund', 'booking_payment', 'subscription_payment'], example: 'cancellation_refund' },
            bookingId: { type: 'string', nullable: true, example: '60c72b2f9b1d8a23d4891b29' },
            note: { type: 'string', example: 'Wallet credited for booking cancellation' },
            createdAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:16:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:16:00.000Z' },
        },
    },
    ErrorResponse: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error description message' },
        },
    },
};
export const swaggerPaths = {
    // ------------------ AUTH ------------------
    '/auth/register': {
        post: {
            summary: 'Register a new patient account',
            tags: ['Auth'],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['name', 'email', 'password'],
                            properties: {
                                name: { type: 'string', example: 'Muhammad Zain' },
                                email: { type: 'string', example: 'zainf2327@gmail.com' },
                                password: { type: 'string', example: 'password123' },
                            },
                        },
                    },
                },
            },
            responses: {
                201: {
                    description: 'User registered successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'User registered successfully' },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            user: { $ref: '#/components/schemas/User' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                400: { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            },
        },
    },
    '/auth/login': {
        post: {
            summary: 'Log into a user account',
            tags: ['Auth'],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['email', 'password'],
                            properties: {
                                email: { type: 'string', example: 'zainf2327@gmail.com' },
                                password: { type: 'string', example: 'password123' },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Login successful',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsIn...' },
                                            user: { $ref: '#/components/schemas/User' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            },
        },
    },
    '/auth/refresh': {
        post: {
            summary: 'Refresh access token using HTTP-only cookie',
            tags: ['Auth'],
            responses: {
                200: {
                    description: 'New access token issued',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsIn...' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                401: { description: 'Invalid or missing refresh token', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            },
        },
    },
    '/auth/logout': {
        post: {
            summary: 'Log out current user and clear refresh token cookie',
            tags: ['Auth'],
            responses: {
                200: {
                    description: 'Logged out successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Logged out successfully' },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    '/auth/me': {
        get: {
            summary: 'Get profile of current authenticated user',
            tags: ['Auth'],
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Authenticated user details',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            user: { $ref: '#/components/schemas/User' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            },
        },
    },
    '/auth/verify-email': {
        post: {
            summary: 'Verify patient email with 6-digit verification code',
            tags: ['Auth'],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['email', 'code'],
                            properties: {
                                email: { type: 'string', example: 'zainf2327@gmail.com' },
                                code: { type: 'string', example: '123456' },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: 'Email verified successfully' },
                400: { description: 'Invalid or expired verification code' },
            },
        },
    },
    '/auth/resend-verification': {
        post: {
            summary: 'Resend email verification code',
            tags: ['Auth'],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['email'],
                            properties: {
                                email: { type: 'string', example: 'zainf2327@gmail.com' },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: 'Verification code resent' },
            },
        },
    },
    '/auth/forgot-password': {
        post: {
            summary: 'Request password reset token via email',
            tags: ['Auth'],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['email'],
                            properties: {
                                email: { type: 'string', example: 'zainf2327@gmail.com' },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: 'Password reset link sent to email' },
            },
        },
    },
    '/auth/reset-password': {
        post: {
            summary: 'Reset password using token received via email',
            tags: ['Auth'],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['token', 'password'],
                            properties: {
                                token: { type: 'string', example: 'a1b2c3d4...' },
                                password: { type: 'string', example: 'newpassword123' },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: 'Password reset successfully' },
            },
        },
    },
    '/auth/set-password': {
        post: {
            summary: 'Set new password for logged-in user',
            tags: ['Auth'],
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['password'],
                            properties: {
                                password: { type: 'string', example: 'newpassword123' },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: 'Password updated successfully' },
            },
        },
    },
    '/auth/google': {
        get: {
            summary: 'Initiate Google OAuth login flow',
            tags: ['Auth'],
            responses: {
                302: { description: 'Redirect to Google OAuth consent screen' },
            },
        },
    },
    '/auth/google/callback': {
        get: {
            summary: 'Handle Google OAuth login callback',
            tags: ['Auth'],
            parameters: [{ in: 'query', name: 'code', required: true, schema: { type: 'string' } }],
            responses: {
                302: { description: 'Redirect to frontend dashboard with cookies set' },
            },
        },
    },
    '/auth/google/calendar': {
        get: {
            summary: 'Initiate Google Calendar connection for home sampling sync',
            tags: ['Auth'],
            security: [{ bearerAuth: [] }],
            responses: {
                302: { description: 'Redirect to Google Calendar OAuth consent' },
            },
        },
    },
    '/auth/google/calendar/callback': {
        get: {
            summary: 'Handle Google Calendar OAuth callback',
            tags: ['Auth'],
            parameters: [{ in: 'query', name: 'code', required: true, schema: { type: 'string' } }],
            responses: {
                302: { description: 'Redirect to patient/staff profile page' },
            },
        },
    },
    '/auth/google/calendar/disconnect': {
        delete: {
            summary: 'Disconnect Google Calendar integration',
            tags: ['Auth'],
            security: [{ bearerAuth: [] }],
            responses: {
                200: { description: 'Google Calendar disconnected' },
            },
        },
    },
    // ------------------ USERS ------------------
    '/users': {
        get: {
            summary: 'List all users (Admin only)',
            tags: ['Users'],
            security: [{ bearerAuth: [] }],
            parameters: [
                { in: 'query', name: 'role', schema: { type: 'string', enum: ['patient', 'staff', 'admin'] } },
                { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
                { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
            ],
            responses: {
                200: {
                    description: 'List of registered users',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            users: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                                            total: { type: 'number', example: 50 },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    '/users/staff': {
        get: {
            summary: 'List all staff users for home-sampling assignment dropdowns (Staff & Admin)',
            tags: ['Users'],
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'List of staff members',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    '/users/{id}': {
        get: {
            summary: 'Get specific user details by ID (Admin only)',
            tags: ['Users'],
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            responses: {
                200: { description: 'User profile details', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            },
        },
        patch: {
            summary: 'Update user role or status (Admin only)',
            tags: ['Users'],
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                role: { type: 'string', enum: ['patient', 'staff', 'admin'] },
                                isActive: { type: 'boolean' },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: 'User updated successfully' },
            },
        },
        delete: {
            summary: 'Deactivate a user account (Admin only)',
            tags: ['Users'],
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            responses: {
                200: { description: 'User account deactivated' },
            },
        },
    },
    '/users/me/profile': {
        patch: {
            summary: 'Update current user profile (name, phone)',
            tags: ['Users'],
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                name: { type: 'string', example: 'Muhammad Zain' },
                                phone: { type: 'string', example: '+923001234567' },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: 'Profile updated successfully' },
            },
        },
    },
    // ------------------ FAMILY MEMBERS ------------------
    '/family-members': {
        get: {
            summary: 'List family members registered under authenticated patient account',
            tags: ['Family Members'],
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'List of family members',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: { type: 'array', items: { $ref: '#/components/schemas/FamilyMember' } },
                                },
                            },
                        },
                    },
                },
            },
        },
        post: {
            summary: 'Add a new family member under patient account',
            tags: ['Family Members'],
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['name', 'dateOfBirth', 'relationship', 'gender'],
                            properties: {
                                name: { type: 'string', example: 'Ali Zain' },
                                dateOfBirth: { type: 'string', format: 'date', example: '1995-05-15' },
                                relationship: { type: 'string', example: 'spouse' },
                                gender: { type: 'string', enum: ['male', 'female', 'other'], example: 'male' },
                            },
                        },
                    },
                },
            },
            responses: {
                201: { description: 'Family member created' },
                403: { description: 'Family member plan limit exceeded' },
            },
        },
    },
    '/family-members/{id}': {
        get: {
            summary: 'Get details of a specific family member',
            tags: ['Family Members'],
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            responses: {
                200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/FamilyMember' } } } },
            },
        },
        patch: {
            summary: 'Update family member details',
            tags: ['Family Members'],
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                relationship: { type: 'string' },
                                gender: { type: 'string', enum: ['male', 'female', 'other'] },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: 'Family member updated' },
            },
        },
        delete: {
            summary: 'Remove a family member',
            tags: ['Family Members'],
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            responses: {
                200: { description: 'Family member removed' },
            },
        },
    },
    // ------------------ SUBSCRIPTION PLANS ------------------
    '/subscription-plans': {
        get: {
            summary: 'List all active subscription plans (Public)',
            tags: ['Subscription Plans'],
            responses: {
                200: {
                    description: 'List of subscription plans',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: { type: 'array', items: { $ref: '#/components/schemas/SubscriptionPlan' } },
                                },
                            },
                        },
                    },
                },
            },
        },
        post: {
            summary: 'Create a new subscription plan (Admin only)',
            tags: ['Subscription Plans'],
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['name', 'price', 'maxFamilyMembers'],
                            properties: {
                                name: { type: 'string', example: 'Family Care Plan' },
                                price: { type: 'number', example: 49 },
                                maxFamilyMembers: { type: 'number', example: 4 },
                                features: { type: 'array', items: { type: 'string' } },
                            },
                        },
                    },
                },
            },
            responses: {
                201: { description: 'Subscription plan created' },
            },
        },
    },
    '/subscription-plans/{id}': {
        patch: {
            summary: 'Update subscription plan details (Admin only)',
            tags: ['Subscription Plans'],
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            responses: {
                200: { description: 'Subscription plan updated' },
            },
        },
        delete: {
            summary: 'Deactivate subscription plan (Admin only)',
            tags: ['Subscription Plans'],
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            responses: {
                200: { description: 'Subscription plan deactivated' },
            },
        },
    },
    // ------------------ SUBSCRIPTIONS ------------------
    '/subscriptions/me': {
        get: {
            summary: 'Get active subscription for current patient',
            tags: ['Subscriptions'],
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Current active subscription',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: { $ref: '#/components/schemas/Subscription' },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    '/subscriptions/create-intent': {
        post: {
            summary: 'Create Stripe PaymentIntent for subscribing to a plan',
            tags: ['Subscriptions'],
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['planId'],
                            properties: {
                                planId: { type: 'string', example: '60c72b2f9b1d8a23d4891b25' },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Stripe client secret returned',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            clientSecret: { type: 'string', example: 'pi_3MtwKsLkdIwHu7ix_secret_xxx' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    '/subscriptions/confirm-payment': {
        post: {
            summary: 'Confirm subscription payment and activate plan',
            tags: ['Subscriptions'],
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['paymentIntentId', 'planId'],
                            properties: {
                                paymentIntentId: { type: 'string', example: 'pi_3MtwKsLkdIwHu7ix28a8C' },
                                planId: { type: 'string', example: '60c72b2f9b1d8a23d4891b25' },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: 'Subscription activated successfully' },
            },
        },
    },
    '/subscriptions/me/family-members': {
        patch: {
            summary: 'Update active family members attached to subscription',
            tags: ['Subscriptions'],
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['activeFamilyMemberIds'],
                            properties: {
                                activeFamilyMemberIds: { type: 'array', items: { type: 'string' }, example: ['60c72b2f9b1d8a23d4891b24'] },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: 'Subscription active family members updated' },
            },
        },
    },
    '/subscriptions/history': {
        get: {
            summary: 'Get patient subscription purchase history',
            tags: ['Subscriptions'],
            security: [{ bearerAuth: [] }],
            responses: {
                200: { description: 'List of past subscriptions' },
            },
        },
    },
    '/subscriptions/me/cancel': {
        patch: {
            summary: 'Cancel current active subscription',
            tags: ['Subscriptions'],
            security: [{ bearerAuth: [] }],
            responses: {
                200: { description: 'Subscription marked as cancelled' },
            },
        },
    },
    '/subscriptions': {
        get: {
            summary: 'List all patient subscriptions (Admin only)',
            tags: ['Subscriptions'],
            security: [{ bearerAuth: [] }],
            responses: {
                200: { description: 'All patient subscriptions' },
            },
        },
    },
    // ------------------ TEST CATEGORIES ------------------
    '/test-categories': {
        get: {
            summary: 'List all test categories (Public)',
            tags: ['Test Categories'],
            responses: {
                200: {
                    description: 'Categories list',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: { type: 'array', items: { $ref: '#/components/schemas/TestCategory' } },
                                },
                            },
                        },
                    },
                },
            },
        },
        post: {
            summary: 'Create test category (Admin only)',
            tags: ['Test Categories'],
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['name'],
                            properties: {
                                name: { type: 'string', example: 'Hematology' },
                                description: { type: 'string', example: 'Blood tests and blood cell counts' },
                            },
                        },
                    },
                },
            },
            responses: {
                201: { description: 'Test category created' },
            },
        },
    },
    '/test-categories/{id}': {
        patch: {
            summary: 'Update test category (Admin only)',
            tags: ['Test Categories'],
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            responses: {
                200: { description: 'Test category updated' },
            },
        },
        delete: {
            summary: 'Delete test category (Admin only)',
            tags: ['Test Categories'],
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            responses: {
                200: { description: 'Test category deleted' },
            },
        },
    },
    // ------------------ TESTS CATALOG ------------------
    '/tests': {
        get: {
            summary: 'List diagnostic tests (Public with pagination, category filter, search)',
            tags: ['Tests'],
            parameters: [
                { in: 'query', name: 'categoryId', schema: { type: 'string' } },
                { in: 'query', name: 'type', schema: { type: 'string', enum: ['lab', 'radiology'] } },
                { in: 'query', name: 'search', schema: { type: 'string' } },
                { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
                { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
            ],
            responses: {
                200: {
                    description: 'Filtered diagnostic tests',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: { type: 'array', items: { $ref: '#/components/schemas/Test' } },
                                },
                            },
                        },
                    },
                },
            },
        },
        post: {
            summary: 'Create a new test item (Admin only)',
            tags: ['Tests'],
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['name', 'price', 'type', 'categoryId'],
                            properties: {
                                name: { type: 'string', example: 'Complete Blood Count (CBC)' },
                                description: { type: 'string' },
                                price: { type: 'number', example: 15 },
                                type: { type: 'string', enum: ['lab', 'radiology'], example: 'lab' },
                                categoryId: { type: 'string', example: '60c72b2f9b1d8a23d4891b27' },
                                preparationInstructions: { type: 'string', example: 'Fasting 8 hours' },
                                duration: { type: 'string', example: '24 hours' },
                                isHomeCollectionAvailable: { type: 'boolean', example: true },
                            },
                        },
                    },
                },
            },
            responses: {
                201: { description: 'Test item created' },
            },
        },
    },
    '/tests/{id}': {
        get: {
            summary: 'Get diagnostic test detail by ID (Public)',
            tags: ['Tests'],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            responses: {
                200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Test' } } } },
            },
        },
        patch: {
            summary: 'Update diagnostic test (Admin only)',
            tags: ['Tests'],
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            responses: {
                200: { description: 'Test item updated' },
            },
        },
        delete: {
            summary: 'Deactivate diagnostic test (Admin only)',
            tags: ['Tests'],
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            responses: {
                200: { description: 'Test item deactivated' },
            },
        },
    },
    // ------------------ BOOKINGS ------------------
    '/bookings': {
        post: {
            summary: 'Create a new test booking (Patient cart checkout)',
            tags: ['Bookings'],
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['tests'],
                            properties: {
                                tests: { type: 'array', items: { type: 'string' }, example: ['60c72b2f9b1d8a23d4891b28'] },
                                forMemberId: { type: 'string', nullable: true, example: null },
                                couponCode: { type: 'string', nullable: true, example: 'SAVE10' },
                                homeSampling: {
                                    type: 'object',
                                    properties: {
                                        requested: { type: 'boolean', example: true },
                                        address: { type: 'string', example: '123 Main St, Lahore' },
                                        scheduledAt: { type: 'string', format: 'date-time', example: '2026-07-25T09:00:00.000Z' },
                                    },
                                },
                                notes: { type: 'string', example: 'Special instructions' },
                            },
                        },
                    },
                },
            },
            responses: {
                201: {
                    description: 'Booking created with status pending_payment',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Booking' } } },
                },
            },
        },
        get: {
            summary: 'List all bookings with status and date filters (Staff & Admin)',
            tags: ['Bookings'],
            security: [{ bearerAuth: [] }],
            parameters: [
                { in: 'query', name: 'status', schema: { type: 'string', enum: ['pending_payment', 'scheduled', 'sample_collected', 'in_lab', 'report_ready', 'completed', 'cancelled'] } },
                { in: 'query', name: 'patientId', schema: { type: 'string' } },
                { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
                { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
            ],
            responses: {
                200: { description: 'Paginated bookings list' },
            },
        },
    },
    '/bookings/me': {
        get: {
            summary: 'List bookings placed by authenticated patient',
            tags: ['Bookings'],
            security: [{ bearerAuth: [] }],
            responses: {
                200: { description: 'Patient booking history' },
            },
        },
    },
    '/bookings/{id}': {
        get: {
            summary: 'Get full booking details by ID (Patient, Staff, Admin)',
            tags: ['Bookings'],
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            responses: {
                200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Booking' } } } },
            },
        },
    },
    '/bookings/{id}/status': {
        patch: {
            summary: 'Update booking status along lifecycle (Staff only)',
            tags: ['Bookings'],
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['status'],
                            properties: {
                                status: { type: 'string', enum: ['scheduled', 'sample_collected', 'in_lab', 'report_ready', 'completed', 'cancelled'] },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: 'Booking status updated' },
            },
        },
    },
    '/bookings/{id}/assign-staff': {
        patch: {
            summary: 'Assign staff member to home-sampling booking (Admin only)',
            tags: ['Bookings'],
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['staffId'],
                            properties: {
                                staffId: { type: 'string', example: '60c72b2f9b1d8a23d4891b99' },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: 'Staff assigned and Google Calendar event created' },
            },
        },
    },
    '/bookings/{id}/cancel': {
        patch: {
            summary: 'Cancel booking and issue wallet refund if paid',
            tags: ['Bookings'],
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            responses: {
                200: { description: 'Booking cancelled and wallet balance credited' },
            },
        },
    },
    // ------------------ REPORTS ------------------
    '/reports': {
        post: {
            summary: 'Upload lab report PDF for a booking (Staff only)',
            tags: ['Reports'],
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'multipart/form-data': {
                        schema: {
                            type: 'object',
                            required: ['bookingId', 'report'],
                            properties: {
                                bookingId: { type: 'string', example: '60c72b2f9b1d8a23d4891b29' },
                                report: { type: 'string', format: 'binary' },
                            },
                        },
                    },
                },
            },
            responses: {
                201: { description: 'Report uploaded, text extracted, and vectorized' },
            },
        },
    },
    '/reports/me': {
        get: {
            summary: 'List reports for authenticated patient',
            tags: ['Reports'],
            security: [{ bearerAuth: [] }],
            responses: {
                200: { description: 'Patient reports list' },
            },
        },
    },
    '/reports/{id}': {
        get: {
            summary: 'Get report metadata by ID',
            tags: ['Reports'],
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            responses: {
                200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Report' } } } },
            },
        },
        delete: {
            summary: 'Delete a report file and metadata (Admin only)',
            tags: ['Reports'],
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            responses: {
                200: { description: 'Report deleted' },
            },
        },
    },
    '/reports/{id}/view': {
        get: {
            summary: 'Stream report PDF inline for in-browser viewing',
            tags: ['Reports'],
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            responses: {
                200: { description: 'PDF stream response with inline Content-Disposition' },
            },
        },
    },
    '/reports/{id}/download': {
        get: {
            summary: 'Stream report PDF as attachment download',
            tags: ['Reports'],
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            responses: {
                200: { description: 'PDF stream response with attachment Content-Disposition' },
            },
        },
    },
    // ------------------ PAYMENTS ------------------
    '/payments/create-intent': {
        post: {
            summary: 'Create Stripe PaymentIntent for booking (Applies patient wallet balance first)',
            tags: ['Payments'],
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['bookingId'],
                            properties: {
                                bookingId: { type: 'string', example: '60c72b2f9b1d8a23d4891b29' },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Returns Stripe client secret or zero-amount bypass indicator',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            clientSecret: { type: 'string', nullable: true },
                                            paymentId: { type: 'string' },
                                            walletAmountUsed: { type: 'number' },
                                            stripeAmount: { type: 'number' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    '/payments/confirm': {
        post: {
            summary: 'Confirm successful payment and transition booking to scheduled',
            tags: ['Payments'],
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['paymentIntentId'],
                            properties: {
                                paymentIntentId: { type: 'string', example: 'pi_3MtwKsLkdIwHu7ix28a8C' },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: 'Payment verified and booking scheduled' },
            },
        },
    },
    '/payments/me': {
        get: {
            summary: 'Get patient billing and payment history',
            tags: ['Payments'],
            security: [{ bearerAuth: [] }],
            responses: {
                200: { description: 'List of patient payments' },
            },
        },
    },
    '/payments': {
        get: {
            summary: 'List all payment transactions across system (Admin only)',
            tags: ['Payments'],
            security: [{ bearerAuth: [] }],
            responses: {
                200: { description: 'All payment records' },
            },
        },
    },
    // ------------------ COUPONS ------------------
    '/coupons': {
        get: {
            summary: 'List all promotional coupons (Admin only)',
            tags: ['Coupons'],
            security: [{ bearerAuth: [] }],
            responses: {
                200: { description: 'List of coupons' },
            },
        },
        post: {
            summary: 'Create a new coupon code (Admin only)',
            tags: ['Coupons'],
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['code', 'discountType', 'discountValue'],
                            properties: {
                                code: { type: 'string', example: 'SUMMER20' },
                                discountType: { type: 'string', enum: ['percentage', 'fixed'], example: 'percentage' },
                                discountValue: { type: 'number', example: 20 },
                                minOrderValue: { type: 'number', example: 50 },
                                maxUses: { type: 'number', example: 100 },
                                expiresAt: { type: 'string', format: 'date-time' },
                            },
                        },
                    },
                },
            },
            responses: {
                201: { description: 'Coupon created' },
            },
        },
    },
    '/coupons/validate': {
        post: {
            summary: 'Validate coupon code against booking total (Patient)',
            tags: ['Coupons'],
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['code', 'totalAmount'],
                            properties: {
                                code: { type: 'string', example: 'SUMMER20' },
                                totalAmount: { type: 'number', example: 100 },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: 'Calculated discount amount returned' },
            },
        },
    },
    '/coupons/{id}': {
        get: {
            summary: 'Get coupon details by ID (Admin only)',
            tags: ['Coupons'],
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            responses: {
                200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Coupon' } } } },
            },
        },
        patch: {
            summary: 'Update coupon settings (Admin only)',
            tags: ['Coupons'],
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            responses: {
                200: { description: 'Coupon updated' },
            },
        },
        delete: {
            summary: 'Delete coupon (Admin only)',
            tags: ['Coupons'],
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
            responses: {
                200: { description: 'Coupon deleted' },
            },
        },
    },
    // ------------------ AI ASSISTANT ------------------
    '/ai/chat': {
        post: {
            summary: 'Send message to AI assistant for report-scoped RAG analysis (Patient only)',
            tags: ['AI Assistant'],
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['reportId', 'message'],
                            properties: {
                                reportId: { type: 'string', example: '6a5e0723e3a13ac3110d4a8c' },
                                message: { type: 'string', example: 'What does my hemogoblin level mean?' },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: 'Streaming response or fallback text answer' },
            },
        },
    },
    '/ai/chat/history': {
        get: {
            summary: 'Get chat conversation history for a specific report (Patient only)',
            tags: ['AI Assistant'],
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'query', name: 'reportId', required: true, schema: { type: 'string' } }],
            responses: {
                200: { description: 'List of past chat messages for report' },
            },
        },
    },
    // ------------------ ANALYTICS ------------------
    '/analytics/overview': {
        get: {
            summary: 'Get overall business metrics (Admin only)',
            tags: ['Analytics'],
            security: [{ bearerAuth: [] }],
            responses: {
                200: { description: 'Total revenue, total bookings, active patients, pending tests' },
            },
        },
    },
    '/analytics/bookings': {
        get: {
            summary: 'Get booking trends over time (Admin only)',
            tags: ['Analytics'],
            security: [{ bearerAuth: [] }],
            responses: {
                200: { description: 'Time-series booking counts' },
            },
        },
    },
    '/analytics/revenue': {
        get: {
            summary: 'Get revenue trends over time (Admin only)',
            tags: ['Analytics'],
            security: [{ bearerAuth: [] }],
            responses: {
                200: { description: 'Time-series revenue totals' },
            },
        },
    },
    '/analytics/top-tests': {
        get: {
            summary: 'Get most booked tests analytics (Admin only)',
            tags: ['Analytics'],
            security: [{ bearerAuth: [] }],
            responses: {
                200: { description: 'List of top diagnostic tests by booking volume' },
            },
        },
    },
    // ------------------ AUDIT LOGS ------------------
    '/audit-logs': {
        get: {
            summary: 'List system audit logs (Admin only)',
            tags: ['Audit Logs'],
            security: [{ bearerAuth: [] }],
            parameters: [
                { in: 'query', name: 'actorId', schema: { type: 'string' } },
                { in: 'query', name: 'action', schema: { type: 'string' } },
                { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
                { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
            ],
            responses: {
                200: { description: 'Paginated audit logs list' },
            },
        },
    },
    // ------------------ WALLET ------------------
    '/wallet/balance': {
        get: {
            summary: 'Get current wallet balance for authenticated patient',
            tags: ['Wallet'],
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Wallet balance',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            walletBalance: { type: 'number', example: 150 },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    '/wallet/transactions': {
        get: {
            summary: 'Get paginated wallet transaction history (Credits & Debits)',
            tags: ['Wallet'],
            security: [{ bearerAuth: [] }],
            parameters: [
                { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
                { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
            ],
            responses: {
                200: { description: 'Wallet credit and debit transaction ledger' },
            },
        },
    },
    // ------------------ WEBHOOKS ------------------
    '/webhooks/stripe': {
        post: {
            summary: 'Stripe event webhook listener',
            tags: ['Webhooks'],
            responses: {
                200: { description: 'Webhook event processed' },
                400: { description: 'Webhook signature verification failed' },
            },
        },
    },
};
