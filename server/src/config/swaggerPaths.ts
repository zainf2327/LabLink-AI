export const swaggerSchemas = {
  User: {
    type: 'object',
    properties: {
      id: { type: 'string', example: '60c72b2f9b1d8a23d4891b23' },
      name: { type: 'string', example: 'Muhammad Zain' },
      email: { type: 'string', example: 'zainf2327@gmail.com' },
      phone: { type: 'string', example: '+923001234567' },
      role: { type: 'string', enum: ['patient', 'staff', 'admin'], example: 'patient' },
      walletBalance: { type: 'number', example: 150 },
      isActive: { type: 'boolean', example: true },
    },
  },
  FamilyMember: {
    type: 'object',
    properties: {
      id: { type: 'string', example: '60c72b2f9b1d8a23d4891b24' },
      userId: { type: 'string', example: '60c72b2f9b1d8a23d4891b23' },
      name: { type: 'string', example: 'Ali Zain' },
      dateOfBirth: { type: 'string', format: 'date', example: '1995-05-15' },
      relationship: { type: 'string', enum: ['spouse', 'child', 'parent', 'sibling'], example: 'sibling' },
      gender: { type: 'string', enum: ['male', 'female', 'other'], example: 'male' },
    },
  },
  SubscriptionPlan: {
    type: 'object',
    properties: {
      id: { type: 'string', example: '60c72b2f9b1d8a23d4891b25' },
      name: { type: 'string', example: 'Family Premium' },
      price: { type: 'number', example: 49 },
      maxFamilyMembers: { type: 'number', example: 4 },
      features: { type: 'array', items: { type: 'string' }, example: ['Free Home Sampling', '10% discount on tests'] },
      isActive: { type: 'boolean', example: true },
    },
  },
  Subscription: {
    type: 'object',
    properties: {
      id: { type: 'string', example: '60c72b2f9b1d8a23d4891b26' },
      userId: { type: 'string', example: '60c72b2f9b1d8a23d4891b23' },
      planId: { type: 'string', example: '60c72b2f9b1d8a23d4891b25' },
      status: { type: 'string', enum: ['active', 'cancelled', 'expired'], example: 'active' },
      startDate: { type: 'string', format: 'date-time', example: '2026-07-22T08:00:00.000Z' },
      renewalDate: { type: 'string', format: 'date-time', example: '2026-08-22T08:00:00.000Z' },
    },
  },
  TestCategory: {
    type: 'object',
    properties: {
      id: { type: 'string', example: '60c72b2f9b1d8a23d4891b27' },
      name: { type: 'string', example: 'Hematology' },
      description: { type: 'string', example: 'Complete blood count and clotting disorders' },
      isActive: { type: 'boolean', example: true },
    },
  },
  Test: {
    type: 'object',
    properties: {
      id: { type: 'string', example: '60c72b2f9b1d8a23d4891b28' },
      categoryId: { type: 'string', example: '60c72b2f9b1d8a23d4891b27' },
      name: { type: 'string', example: 'Complete Blood Count (CBC)' },
      description: { type: 'string', example: 'Evaluates overall health and detects a wide range of disorders' },
      price: { type: 'number', example: 15 },
      type: { type: 'string', enum: ['lab', 'radiology'], example: 'lab' },
      isActive: { type: 'boolean', example: true },
    },
  },
  Booking: {
    type: 'object',
    properties: {
      id: { type: 'string', example: '60c72b2f9b1d8a23d4891b29' },
      patientId: { type: 'string', example: '60c72b2f9b1d8a23d4891b23' },
      familyMemberId: { type: 'string', nullable: true, example: null },
      tests: { type: 'array', items: { type: 'string' }, example: ['60c72b2f9b1d8a23d4891b28'] },
      status: { type: 'string', enum: ['pending_payment', 'scheduled', 'sample_collected', 'in_lab', 'report_ready', 'cancelled'], example: 'scheduled' },
      totalAmount: { type: 'number', example: 15 },
      paymentStatus: { type: 'string', enum: ['pending', 'paid', 'refunded'], example: 'paid' },
      homeSampling: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean', example: true },
          address: { type: 'string', example: 'Jail Road, Lahore' },
          date: { type: 'string', format: 'date', example: '2026-07-23' },
          timeSlot: { type: 'string', example: '09:00 AM - 11:00 AM' },
        },
      },
    },
  },
  Report: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '6a5e0723e3a13ac3110d4a8c' },
      bookingId: { type: 'string', example: '6a5e0633e3a13ac3110d4a64' },
      patientId: { type: 'string', example: '6a5e05d6e3a13ac3110d4a62' },
      fileUrl: { type: 'string', example: 'https://lablink-reports-bucket.s3.amazonaws.com/reports/abc.pdf' },
      fileKey: { type: 'string', example: 'reports/abc.pdf' },
      mimeType: { type: 'string', example: 'application/pdf' },
      versionSuffix: { type: 'string', example: 'v2' },
      lastViewedAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:11:00.000Z' },
      accessLog: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            viewedBy: { type: 'string', example: '6a5dd4dfe419826f3cdb8553' },
            viewedAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:11:00.000Z' },
            role: { type: 'string', example: 'staff' },
          },
        },
      },
    },
  },
  Payment: {
    type: 'object',
    properties: {
      id: { type: 'string', example: '60c72b2f9b1d8a23d4891b30' },
      bookingId: { type: 'string', example: '60c72b2f9b1d8a23d4891b29' },
      patientId: { type: 'string', example: '60c72b2f9b1d8a23d4891b23' },
      amount: { type: 'number', example: 15 },
      status: { type: 'string', enum: ['pending', 'succeeded', 'failed'], example: 'succeeded' },
      stripePaymentIntentId: { type: 'string', example: 'pi_3MtwKsLkdIwHu7ix28a8C' },
    },
  },
  Coupon: {
    type: 'object',
    properties: {
      id: { type: 'string', example: '60c72b2f9b1d8a23d4891b31' },
      code: { type: 'string', example: 'SAVE10' },
      discountType: { type: 'string', enum: ['percentage', 'fixed'], example: 'percentage' },
      discountValue: { type: 'number', example: 10 },
      maxDiscount: { type: 'number', example: 5 },
      minBookingAmount: { type: 'number', example: 20 },
      expiryDate: { type: 'string', format: 'date-time', example: '2026-12-31T23:59:59.000Z' },
      isActive: { type: 'boolean', example: true },
    },
  },
  ChatMessage: {
    type: 'object',
    properties: {
      id: { type: 'string', example: '60c72b2f9b1d8a23d4891b32' },
      reportId: { type: 'string', example: '6a5e0723e3a13ac3110d4a8c' },
      patientId: { type: 'string', example: '60c72b2f9b1d8a23d4891b23' },
      role: { type: 'string', enum: ['user', 'assistant'], example: 'assistant' },
      content: { type: 'string', example: 'Your White Blood Cell count is normal.' },
      createdAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:12:00.000Z' },
    },
  },
  AuditLog: {
    type: 'object',
    properties: {
      id: { type: 'string', example: '60c72b2f9b1d8a23d4891b33' },
      userId: { type: 'string', example: '60c72b2f9b1d8a23d4891b23' },
      action: { type: 'string', example: 'DELETE_REPORT' },
      targetModel: { type: 'string', example: 'Report' },
      targetId: { type: 'string', example: '6a5e0723e3a13ac3110d4a8c' },
      details: { type: 'string', example: 'Deleted report for patient Muhammad Zain' },
      timestamp: { type: 'string', format: 'date-time', example: '2026-07-22T08:15:00.000Z' },
    },
  },
  WalletTransaction: {
    type: 'object',
    properties: {
      id: { type: 'string', example: '60c72b2f9b1d8a23d4891b34' },
      patientId: { type: 'string', example: '60c72b2f9b1d8a23d4891b23' },
      bookingId: { type: 'string', nullable: true, example: null },
      amount: { type: 'number', example: 50 },
      type: { type: 'string', enum: ['credit', 'debit'], example: 'credit' },
      description: { type: 'string', example: 'Refund for booking cancellation' },
      createdAt: { type: 'string', format: 'date-time', example: '2026-07-22T08:16:00.000Z' },
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
        400: {
          description: 'Validation failed',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
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
          description: 'Login successful, returns access token',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                  user: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
        401: {
          description: 'Invalid credentials',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
  },
  '/auth/refresh': {
    post: {
      summary: 'Refresh JWT access token using httpOnly cookie',
      tags: ['Auth'],
      responses: {
        200: {
          description: 'Refreshed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                },
              },
            },
          },
        },
        401: {
          description: 'Invalid refresh token',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
  },
  '/auth/logout': {
    post: {
      summary: 'Clear cookies and log out current user',
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
      summary: 'Get current authenticated user profile',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Profile details',
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
        401: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
  },
  '/auth/verify-email': {
    post: {
      summary: 'Verify user email using the verification code',
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
        200: {
          description: 'Email verified successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Email verified successfully. Account is now active.' },
                },
              },
            },
          },
        },
        400: {
          description: 'Invalid or expired code',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
  },
  '/auth/resend-verification': {
    post: {
      summary: 'Resend verification code email',
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
        200: {
          description: 'Verification code sent',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Verification code resent successfully' },
                },
              },
            },
          },
        },
        400: {
          description: 'Error processing request',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
  },
  '/auth/forgot-password': {
    post: {
      summary: 'Send password reset token email',
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
        200: {
          description: 'Password reset link sent',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Password reset email sent successfully' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/auth/reset-password': {
    post: {
      summary: 'Reset password using the email token',
      tags: ['Auth'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token', 'password'],
              properties: {
                token: { type: 'string', example: 'a1b2c3d4e5f6...' },
                password: { type: 'string', example: 'newpassword123' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Password reset successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Password reset successfully' },
                },
              },
            },
          },
        },
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
        200: {
          description: 'Password set successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Password set successfully' },
                },
              },
            },
          },
        },
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
        { in: 'query', name: 'role', schema: { type: 'string' }, description: 'Filter by role' },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
      ],
      responses: {
        200: {
          description: 'Success',
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
  '/users/{id}': {
    get: {
      summary: 'Get user profile by ID (Admin only)',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: {
        200: {
          description: 'Success',
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
      },
    },
    patch: {
      summary: 'Update user status or role (Admin only)',
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
        200: { description: 'Updated successfully' },
      },
    },
    delete: {
      summary: 'Deactivate a user account (Admin only)',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Deactivated successfully' },
      },
    },
  },
  '/users/me/profile': {
    patch: {
      summary: 'Update own profile metadata (Patient/Staff)',
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
                phone: { type: 'string', example: '+923009998877' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Profile updated' },
      },
    },
  },

  // ------------------ FAMILY MEMBERS ------------------
  '/family-members': {
    get: {
      summary: 'List own family members (Patient only)',
      tags: ['Family Members'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      familyMembers: { type: 'array', items: { $ref: '#/components/schemas/FamilyMember' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      summary: 'Add a new family member (Patient only)',
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
                relationship: { type: 'string', enum: ['spouse', 'child', 'parent', 'sibling'] },
                gender: { type: 'string', enum: ['male', 'female', 'other'] },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Created successfully' },
      },
    },
  },
  '/family-members/{id}': {
    get: {
      summary: 'Get details of a specific family member (Patient only)',
      tags: ['Family Members'],
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      familyMember: { $ref: '#/components/schemas/FamilyMember' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    patch: {
      summary: 'Update family member details (Patient only)',
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
                relationship: { type: 'string', enum: ['spouse', 'child', 'parent', 'sibling'] },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Updated' },
      },
    },
    delete: {
      summary: 'Remove family member (Patient only)',
      tags: ['Family Members'],
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Deleted' },
      },
    },
  },

  // ------------------ SUBSCRIPTION PLANS ------------------
  '/subscription-plans': {
    get: {
      summary: 'List active plans',
      tags: ['Subscription Plans'],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      plans: { type: 'array', items: { $ref: '#/components/schemas/SubscriptionPlan' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      summary: 'Create a new plan template (Admin only)',
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
                name: { type: 'string', example: 'Enterprise Unlimited' },
                price: { type: 'number', example: 149 },
                maxFamilyMembers: { type: 'number', example: 10 },
                features: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Created' },
      },
    },
  },
  '/subscription-plans/{id}': {
    patch: {
      summary: 'Update plan details (Admin only)',
      tags: ['Subscription Plans'],
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
                price: { type: 'number' },
                isActive: { type: 'boolean' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Updated' },
      },
    },
    delete: {
      summary: 'Deactivate a subscription plan (Admin only)',
      tags: ['Subscription Plans'],
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Deactivated' },
      },
    },
  },

  // ------------------ SUBSCRIPTIONS ------------------
  '/subscriptions/me': {
    get: {
      summary: 'Get active subscription (Patient only)',
      tags: ['Subscriptions'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      subscription: { $ref: '#/components/schemas/Subscription' },
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
  '/subscriptions': {
    get: {
      summary: 'List all user subscriptions (Admin only)',
      tags: ['Subscriptions'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      subscriptions: { type: 'array', items: { $ref: '#/components/schemas/Subscription' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      summary: 'Subscribe to a plan (Patient only)',
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
        201: { description: 'Subscribed' },
      },
    },
  },
  '/subscriptions/me/cancel': {
    patch: {
      summary: 'Cancel own active subscription (Patient only)',
      tags: ['Subscriptions'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: 'Cancelled' },
      },
    },
  },

  // ------------------ TEST CATEGORIES ------------------
  '/test-categories': {
    get: {
      summary: 'List all categories',
      tags: ['Test Categories'],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      categories: { type: 'array', items: { $ref: '#/components/schemas/TestCategory' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      summary: 'Create category (Admin only)',
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
                description: { type: 'string', example: 'Blood related diagnostics' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Created' },
      },
    },
  },
  '/test-categories/{id}': {
    patch: {
      summary: 'Update category (Admin only)',
      tags: ['Test Categories'],
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
                description: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Updated' },
      },
    },
    delete: {
      summary: 'Delete category (Admin only)',
      tags: ['Test Categories'],
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Deleted' },
      },
    },
  },

  // ------------------ TESTS ------------------
  '/tests': {
    get: {
      summary: 'List catalog tests (paginated, filtered, searchable)',
      tags: ['Tests'],
      parameters: [
        { in: 'query', name: 'search', schema: { type: 'string' } },
        { in: 'query', name: 'categoryId', schema: { type: 'string' } },
        { in: 'query', name: 'type', schema: { type: 'string', enum: ['lab', 'radiology'] } },
      ],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      tests: { type: 'array', items: { $ref: '#/components/schemas/Test' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      summary: 'Create test template (Admin only)',
      tags: ['Tests'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['categoryId', 'name', 'price', 'type'],
              properties: {
                categoryId: { type: 'string', example: '60c72b2f9b1d8a23d4891b27' },
                name: { type: 'string', example: 'Complete Blood Count (CBC)' },
                description: { type: 'string' },
                price: { type: 'number', example: 15 },
                type: { type: 'string', enum: ['lab', 'radiology'] },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Created' },
      },
    },
  },
  '/tests/{id}': {
    get: {
      summary: 'Get test detail',
      tags: ['Tests'],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      test: { $ref: '#/components/schemas/Test' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    patch: {
      summary: 'Update test (Admin only)',
      tags: ['Tests'],
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
                price: { type: 'number' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Updated' },
      },
    },
    delete: {
      summary: 'Deactivate test (Admin only)',
      tags: ['Tests'],
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Deactivated' },
      },
    },
  },

  // ------------------ BOOKINGS ------------------
  '/bookings': {
    get: {
      summary: 'List all bookings (Staff/Admin only)',
      tags: ['Bookings'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      bookings: { type: 'array', items: { $ref: '#/components/schemas/Booking' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      summary: 'Create a new booking/checkout (Patient only)',
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
                familyMemberId: { type: 'string', example: '60c72b2f9b1d8a23d4891b24', nullable: true },
                tests: { type: 'array', items: { type: 'string' }, example: ['60c72b2f9b1d8a23d4891b28'] },
                couponCode: { type: 'string', example: 'SAVE10', nullable: true },
                homeSampling: {
                  type: 'object',
                  properties: {
                    enabled: { type: 'boolean', example: true },
                    address: { type: 'string', example: 'Jail Road, Lahore' },
                    date: { type: 'string', format: 'date', example: '2026-07-23' },
                    timeSlot: { type: 'string', example: '09:00 AM - 11:00 AM' },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Booking created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      booking: { $ref: '#/components/schemas/Booking' },
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
  '/bookings/me': {
    get: {
      summary: 'List own bookings (Patient only)',
      tags: ['Bookings'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      bookings: { type: 'array', items: { $ref: '#/components/schemas/Booking' } },
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
  '/bookings/{id}': {
    get: {
      summary: 'Get details of a specific booking',
      tags: ['Bookings'],
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      booking: { $ref: '#/components/schemas/Booking' },
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
  '/bookings/{id}/status': {
    patch: {
      summary: 'Update booking progress status (Staff only)',
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
                status: { type: 'string', enum: ['scheduled', 'sample_collected', 'in_lab', 'report_ready'] },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Status updated' },
      },
    },
  },
  '/bookings/{id}/cancel': {
    patch: {
      summary: 'Cancel booking and initiate refunds (Patient/Staff/Admin)',
      tags: ['Bookings'],
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Booking cancelled' },
      },
    },
  },
  '/bookings/{id}/assign-staff': {
    patch: {
      summary: 'Assign field staff worker for home sampling (Admin/Staff only)',
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
                staffId: { type: 'string', example: '60c72b2f9b1d8a23d4891b24' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Staff assigned' },
      },
    },
  },

  // ------------------ REPORTS ------------------
  '/reports': {
    post: {
      summary: 'Upload report PDF (Staff only)',
      tags: ['Reports'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['report', 'bookingId'],
              properties: {
                report: { type: 'string', format: 'binary' },
                bookingId: { type: 'string', example: '60c72b2f9b1d8a23d4891b29' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Uploaded successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      report: { $ref: '#/components/schemas/Report' },
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
  '/reports/me': {
    get: {
      summary: 'Get all reports for the logged-in patient',
      tags: ['Reports'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      reports: { type: 'array', items: { $ref: '#/components/schemas/Report' } },
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
  '/reports/{id}/view': {
    get: {
      summary: 'Stream the report PDF file inline',
      tags: ['Reports'],
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'PDF stream' },
      },
    },
  },
  '/reports/{id}/download': {
    get: {
      summary: 'Stream the report PDF file as named download attachment',
      tags: ['Reports'],
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'PDF file attachment download' },
      },
    },
  },
  '/reports/{id}': {
    get: {
      summary: 'Get report metadata',
      tags: ['Reports'],
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      report: { $ref: '#/components/schemas/Report' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    delete: {
      summary: 'Delete report metadata and S3 file (Admin only)',
      tags: ['Reports'],
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Deleted successfully' },
      },
    },
  },

  // ------------------ PAYMENTS ------------------
  '/payments/create-intent': {
    post: {
      summary: 'Create Stripe PaymentIntent (Patient only)',
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
          description: 'Intent created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  clientSecret: { type: 'string', example: 'pi_3MtwKsLkdIwHu7ix28a8C_secret_xyz' },
                  walletApplied: { type: 'number', example: 50 },
                  remainderCharged: { type: 'number', example: 15 },
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
      summary: 'Confirm Stripe PaymentIntent and finalize booking status (Patient only)',
      tags: ['Payments'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['bookingId', 'paymentIntentId'],
              properties: {
                bookingId: { type: 'string', example: '60c72b2f9b1d8a23d4891b29' },
                paymentIntentId: { type: 'string', example: 'pi_3MtwKsLkdIwHu7ix28a8C' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Payment confirmed and booking activated' },
      },
    },
  },
  '/payments/me': {
    get: {
      summary: 'Get billing payment history (Patient only)',
      tags: ['Payments'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      payments: { type: 'array', items: { $ref: '#/components/schemas/Payment' } },
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
  '/payments': {
    get: {
      summary: 'List all payments (Admin only)',
      tags: ['Payments'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      payments: { type: 'array', items: { $ref: '#/components/schemas/Payment' } },
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

  // ------------------ COUPONS ------------------
  '/coupons': {
    get: {
      summary: 'List all coupons (Admin only)',
      tags: ['Coupons'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      coupons: { type: 'array', items: { $ref: '#/components/schemas/Coupon' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      summary: 'Create discount coupon code (Admin only)',
      tags: ['Coupons'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code', 'discountType', 'discountValue', 'expiryDate'],
              properties: {
                code: { type: 'string', example: 'SAVE10' },
                discountType: { type: 'string', enum: ['percentage', 'fixed'] },
                discountValue: { type: 'number', example: 10 },
                maxDiscount: { type: 'number', example: 5 },
                minBookingAmount: { type: 'number', example: 20 },
                expiryDate: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Created' },
      },
    },
  },
  '/coupons/{id}': {
    get: {
      summary: 'Get details of coupon (Admin only)',
      tags: ['Coupons'],
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      coupon: { $ref: '#/components/schemas/Coupon' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    patch: {
      summary: 'Update coupon (Admin only)',
      tags: ['Coupons'],
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                isActive: { type: 'boolean' },
                expiryDate: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Updated' },
      },
    },
    delete: {
      summary: 'Delete coupon (Admin only)',
      tags: ['Coupons'],
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Deleted' },
      },
    },
  },
  '/coupons/validate': {
    post: {
      summary: 'Validate coupon code applicability and calculate savings (Patient only)',
      tags: ['Coupons'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code', 'bookingAmount'],
              properties: {
                code: { type: 'string', example: 'SAVE10' },
                bookingAmount: { type: 'number', example: 50 },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Savings result',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  discountAmount: { type: 'number', example: 5 },
                  finalAmount: { type: 'number', example: 45 },
                },
              },
            },
          },
        },
      },
    },
  },

  // ------------------ AI ASSISTANT ------------------
  '/ai/chat': {
    post: {
      summary: 'Send chatbot query scoped to medical report (Patient only)',
      tags: ['AI Assistant'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['message', 'reportId'],
              properties: {
                message: { type: 'string', example: 'Explain the hemoglobin level' },
                reportId: { type: 'string', example: '6a5e0723e3a13ac3110d4a8c' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'AI Answer response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { $ref: '#/components/schemas/ChatMessage' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/ai/chat/history': {
    get: {
      summary: 'Retrieve chat conversation list history (Patient only)',
      tags: ['AI Assistant'],
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'query', name: 'reportId', required: true, schema: { type: 'string' } }],
      responses: {
        200: {
          description: 'Chat list history',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      messages: { type: 'array', items: { $ref: '#/components/schemas/ChatMessage' } },
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

  // ------------------ ANALYTICS ------------------
  '/analytics/overview': {
    get: {
      summary: 'Get overall statistics overview numbers (Admin only)',
      tags: ['Analytics'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Overview',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      totalBookings: { type: 'number', example: 120 },
                      revenue: { type: 'number', example: 4500 },
                      newPatients: { type: 'number', example: 25 },
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
  '/analytics/bookings': {
    get: {
      summary: 'Get bookings counts over time charts (Admin only)',
      tags: ['Analytics'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: 'Bookings list by timeframe' },
      },
    },
  },
  '/analytics/revenue': {
    get: {
      summary: 'Get revenue total charts over time (Admin only)',
      tags: ['Analytics'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: 'Revenue list by timeframe' },
      },
    },
  },
  '/analytics/top-tests': {
    get: {
      summary: 'Get top booked test items (Admin only)',
      tags: ['Analytics'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: 'Top test list' },
      },
    },
  },

  // ------------------ AUDIT LOGS ------------------
  '/audit-logs': {
    get: {
      summary: 'Query admin audit log ledger (Admin only)',
      tags: ['Audit Logs'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'actorId', schema: { type: 'string' } },
        { in: 'query', name: 'action', schema: { type: 'string' } },
      ],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      logs: { type: 'array', items: { $ref: '#/components/schemas/AuditLog' } },
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

  // ------------------ WALLET ------------------
  '/wallet/balance': {
    get: {
      summary: 'Get current wallet balance amount (Patient only)',
      tags: ['Wallet'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Balance',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  balance: { type: 'number', example: 150 },
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
      summary: 'Get transaction history entries (Patient only)',
      tags: ['Wallet'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      transactions: { type: 'array', items: { $ref: '#/components/schemas/WalletTransaction' } },
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
};
