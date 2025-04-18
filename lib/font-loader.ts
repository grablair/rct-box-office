// Font loader utility to register custom fonts
export async function loadCustomFonts() {
  try {
    // Register all the custom fonts
    const fontWeights = [350, 400, 500, 550, 600, 700]

    await Promise.all(
      fontWeights.map(async (weight) => {
        const font = new FontFace("HankenGrotesk", `url(/fonts/adjusted-${weight}.ttf)`, { weight: weight.toString() })

        // Wait for font to be loaded
        const loadedFont = await font.load()

        // Add font to document
        document.fonts.add(loadedFont)
      }),
    )

    return true
  } catch (error) {
    console.error("Error loading custom fonts:", error)
    return false
  }
}

// Helper to get show abbreviation for title images
export function getShowAbbreviation(showName: string): string {
  // Simple implementation - convert to lowercase and remove spaces
  // You might want to implement a more sophisticated mapping based on your needs
  return showName.toLowerCase().replace(/\s+/g, "-")
}
