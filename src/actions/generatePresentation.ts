'use server'

import { auth } from '@clerk/nextjs/server'
import { generateAdvancedPresentation } from '@/agentic-workflow-v2'

/**
 * Server Action: Generate Presentation using Advanced V2 Workflow
 * 
 * This wraps the V2 agentic workflow with authentication and error handling.
 * It creates a project in the database and generates a complete presentation.
 * 
 * @param topic - The main topic for the presentation
 * @param additionalContext - Optional additional context or requirements
 * @param themePreference - Theme preference ('light' or 'dark')
 * @returns Result object with success status, projectId, slides, and metadata
 */
export async function generatePresentationAction(
  topic: string,
  additionalContext?: string,
  themePreference: string = 'light'
) {
  try {
    // Authenticate user
    const { userId } = await auth()
    
    if (!userId) {
      return { 
        success: false, 
        error: 'Not authenticated. Please sign in to generate presentations.' 
      }
    }

    // Validate input
    if (!topic || topic.trim().length === 0) {
      return {
        success: false,
        error: 'Topic is required'
      }
    }

    if (topic.length > 500) {
      return {
        success: false,
        error: 'Topic is too long (max 500 characters)'
      }
    }

    // Generate presentation using V2 workflow
    console.log('🚀 Starting V2 workflow for:', topic)
    
    const result = await generateAdvancedPresentation(
      userId,
      topic,
      additionalContext,
      themePreference
    )

    if (result.success) {
      console.log('✅ V2 workflow completed:', {
        projectId: result.projectId,
        slideCount: result.slideCount,
        progress: result.progress
      })
    } else {
      console.error('❌ V2 workflow failed:', result.error)
    }

    return result
    
  } catch (error) {
    console.error('❌ Server action error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Type definition for the result
 */
export type GeneratePresentationResult = Awaited<ReturnType<typeof generatePresentationAction>>
