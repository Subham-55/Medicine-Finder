'use client'

import { useState, useCallback } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { LANGUAGES, getLanguageByCode } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export default function LanguageSelector() {
  const { language, setLanguage } = useAppStore()
  const [open, setOpen] = useState(false)

  const currentLang = getLanguageByCode(language)
  const isRtl = currentLang?.dir === 'rtl'

  const handleSelect = useCallback(
    (code: string) => {
      const lang = getLanguageByCode(code)
      if (!lang || lang.code === language) {
        setOpen(false)
        return
      }
      setLanguage(code)
      toast.success(`Language changed to ${lang.nativeName}`)
      setOpen(false)
    },
    [language, setLanguage]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          dir={isRtl ? 'rtl' : 'ltr'}
          className={cn(
            'w-full justify-between font-normal',
            isRtl && 'flex-row-reverse text-right'
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <span className="text-base leading-none">{currentLang?.flag}</span>
            <span className="truncate">{currentLang?.nativeName}</span>
          </span>
          <ChevronsUpDown className="shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command dir={isRtl ? 'rtl' : 'ltr'}>
          <CommandInput placeholder="Search languages..." />
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup>
              <ScrollArea className="max-h-64">
                <div className="flex flex-col">
                  {LANGUAGES.map((lang) => {
                    const isSelected = lang.code === language
                    const showEnglishName =
                      lang.name.toLowerCase() !== lang.nativeName.toLowerCase()

                    return (
                      <CommandItem
                        key={lang.code}
                        value={`${lang.name} ${lang.nativeName} ${lang.code}`}
                        onSelect={() => handleSelect(lang.code)}
                        dir={lang.dir}
                        className={cn(
                          'flex items-center gap-2.5 cursor-pointer px-3 py-2.5',
                          lang.dir === 'rtl' && 'flex-row-reverse text-right'
                        )}
                      >
                        <span className="text-base leading-none shrink-0">
                          {lang.flag}
                        </span>
                        <span className="flex-1 truncate">
                          <span className="font-medium">{lang.nativeName}</span>
                          {showEnglishName && (
                            <span className="text-muted-foreground text-xs ml-1.5 rtl:mr-1.5 rtl:ml-0">
                              {lang.name}
                            </span>
                          )}
                        </span>
                        <Check
                          className={cn(
                            'shrink-0 size-4 transition-opacity',
                            isSelected
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                    )
                  })}
                </div>
              </ScrollArea>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}